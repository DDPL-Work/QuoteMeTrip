/**
 * Disappearing Messages (TTL) and Presence integration tests.
 */
import 'dotenv/config';
if (!process.env.DB_TEST_NAME) process.env.DB_TEST_NAME = process.env.DB_NAME;
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getSequelize, closeDatabase } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import { createServer } from 'node:http';
import app from '../../src/app.js';
import { initSocketServer, closeSocketServer, getUserPresence } from '../../src/realtime/socket.js';

let server;
let baseUrl;
let models;

const stops = () => [
  { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
  { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, type: 'final' },
];

const items = () => [
  { title: 'Hotel stay', itemType: 'hotel', quantity: 2, unitPrice: 100 },
];

function email(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

describe('Disappearing Messages TTL & Presence tests', () => {
  let travellerToken;
  let travellerUser;
  let agencyToken;
  let agencyUser;
  let conversationId;

  before(async () => {
    const db = getSequelize();
    models = initModels(db);
    await migrateUp(db);

    const httpServer = createServer(app);
    initSocketServer(httpServer);
    await new Promise((resolve) => {
      server = httpServer.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 1. Register traveller
    const trRes = await api('POST', '/api/v1/auth/register/traveller', {
      body: {
        name: 'TTL Traveller',
        email: email('ttl-traveller'),
        password: 'Password123!',
        firstName: 'TTL',
        lastName: 'Traveller',
      },
    });
    travellerToken = trRes.json.data.accessToken;
    travellerUser = trRes.json.data.user;

    // 2. Register agency
    const agRes = await api('POST', '/api/v1/auth/register/agency', {
      body: {
        name: 'TTL Agency',
        email: email('ttl-agency'),
        password: 'Password123!',
        agencyName: 'TTL Travel Agency',
      },
    });
    agencyToken = agRes.json.data.accessToken;
    agencyUser = agRes.json.data.user;

    // Approve agency profile & give active membership plan
    const profile = await models.AgencyProfile.findOne({ where: { userId: agencyUser.id } });
    await profile.update({ status: 'approved', businessEmail: `biz-${profile.id}@example.com` });
    const plan = (await models.MembershipPlan.findOne()) || (await models.MembershipPlan.create({ name: 'Plan', slug: `plan-${Date.now()}`, price: 10, currency: 'USD', durationDays: 30 }));
    await models.AgencyMembership.create({ agencyId: profile.id, planId: plan.id, status: 'active', startsAt: new Date(), endsAt: null });

    // 3. Create route + travel request
    const routeRes = await api('POST', '/api/v1/routes', { token: travellerToken, body: { stops: stops() } });
    const reqRes = await api('POST', '/api/v1/travel-requests', {
      token: travellerToken,
      body: {
        routeId: routeRes.json.data.route.id,
        travelStartDate: '2026-11-01',
        travelEndDate: '2026-11-10',
        numberOfTravellers: 2,
      },
    });
    await api('POST', `/api/v1/travel-requests/${reqRes.json.data.request.id}/submit`, { token: travellerToken });

    await models.TravelRequestAgency.create({
      travelRequestId: reqRes.json.data.request.id,
      agencyId: profile.id,
      status: 'matched',
    });

    // 4. Agency submits quotation
    const qRes = await api('POST', `/api/v1/agency/travel-requests/${reqRes.json.data.request.id}/quotations`, {
      token: agencyToken,
      body: { quotationType: 'full_package', items: items(), currency: 'USD' },
    });
    await api('POST', `/api/v1/agency/quotations/${qRes.json.data.quotation.id}/submit`, { token: agencyToken });

    // 5. Open conversation
    const convRes = await api('POST', '/api/v1/conversations', {
      token: travellerToken,
      body: {
        travelRequestId: reqRes.json.data.request.id,
        agencyId: qRes.json.data.quotation.agencyId,
      },
    });
    conversationId = convRes.json.data.conversation.id;
  });

  after(async () => {
    await closeSocketServer();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  });

  test('update disappearing messages TTL settings and send expiring messages', async () => {
    // Check initial TTL is 0
    const getRes = await api('GET', `/api/v1/conversations/${conversationId}`, { token: travellerToken });
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.json.data.conversation.disappearingTtl, 0);

    // Update TTL to 24 hours (86400 seconds)
    const patchRes = await api('PATCH', `/api/v1/conversations/${conversationId}/ttl`, { token: travellerToken, body: { disappearingTtl: 86400 } });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.json.data.disappearingTtl, 86400);

    // Send a message
    const sendRes = await api('POST', `/api/v1/conversations/${conversationId}/messages`, { token: travellerToken, body: { body: 'This will expire in 24h' } });
    assert.strictEqual(sendRes.status, 201);
    assert.ok(sendRes.json.data.message.expiresAt, 'Message should have an expiresAt timestamp');

    // List messages
    const listRes = await api('GET', `/api/v1/conversations/${conversationId}/messages`, { token: travellerToken });
    assert.strictEqual(listRes.status, 200);
    const msgs = listRes.json.data.messages;
    const sentMsg = msgs.find((m) => m.id === sendRes.json.data.message.id);
    assert.ok(sentMsg);
    assert.strictEqual(sentMsg.isExpired, false);
  });

  test('user presence helper returns online/offline state', async () => {
    const travellerPresence = getUserPresence(travellerUser.id);
    assert.ok('isOnline' in travellerPresence);
    assert.ok('lastSeen' in travellerPresence);
  });
});
