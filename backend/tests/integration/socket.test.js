/**
 * Phase 6 socket integration tests (realtime delivery).
 *
 * Full flow against the ISOLATED test database only (NODE_ENV=test).
 * Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * NOTE: app.js exports the express app WITHOUT sockets, so this file
 * builds its own http server + initSocketServer(app) (then closes
 * everything in after()).
 *
 * Covers: unauthenticated connections rejected, invalid tokens
 * rejected, join own conversation ok + live `conversation:message`
 * after a REST send, join on another pair's conversation rejected,
 * and no cross-room leaks.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';
process.env.JWT_ACCESS_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';

import assert from 'node:assert';
import http from 'node:http';
import { before, describe, test, after } from 'node:test';
import { io as ioClient } from 'socket.io-client';

import app from '../../src/app.js';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import {
  initSocketServer,
  resetSocketServer,
  closeSocketServer,
} from '../../src/realtime/socket.js';
import { clearNotificationListeners } from '../../src/modules/notifications/notification-events.js';

const suffix = Date.now().toString(36);
let emailCounter = 0;
const email = (name) => `${name}+${suffix}-${emailCounter++}@example.com`;

let db;
let models;
let server;
let baseUrl;

let sharedPlan = null;
const ownedAgencyIds = new Set();

const openSockets = new Set();

const stops = () => [
  { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
  { name: 'Bolu', latitude: 40.7333, longitude: 31.6, type: 'intermediate' },
  { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, type: 'final' },
];

const items = () => [
  { title: 'Hotel stay', itemType: 'hotel', quantity: 2, unitPrice: 100 },
  { title: 'Airport transfer', itemType: 'vehicle', quantity: 1, unitPrice: 49.99 },
];

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

async function registerTraveller() {
  const res = await api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Socket Tester',
      email: email('socket-traveller'),
      password: 'password-123',
      firstName: 'Socket',
      lastName: 'Tester',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

async function registerAgency(tag = 'socket-agency') {
  const res = await api('POST', '/api/v1/auth/register/agency', {
    body: {
      email: email(tag),
      password: 'password-123',
      agencyName: `Socket Agency ${suffix}-${emailCounter}`,
      contactPerson: 'Agency Owner',
      city: 'Istanbul',
      country: 'Turkiye',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

async function getSharedPlan() {
  if (!sharedPlan) {
    const tag = `phase6-socket-${suffix}`;
    sharedPlan =
      (await models.MembershipPlan.findOne({ where: { slug: tag } })) ||
      (await models.MembershipPlan.create({
        name: `Phase 6 socket ${suffix}`,
        slug: tag,
        price: 10,
        currency: 'USD',
        durationDays: 30,
      }));
  }
  return sharedPlan;
}

async function makeEligible(userId) {
  const profile = await models.AgencyProfile.findOne({ where: { userId } });
  assert.ok(profile, 'agency profile should exist after registration');
  await profile.update({ status: 'approved' });
  const plan = await getSharedPlan();
  await models.AgencyMembership.create({
    agencyId: profile.id,
    planId: plan.id,
    status: 'active',
    startsAt: new Date(Date.now() - 60_000),
    endsAt: null,
  });
  ownedAgencyIds.add(profile.id);
  return profile;
}

async function createSubmittedRequest(token) {
  const saved = await api('POST', '/api/v1/routes', { token, body: { stops: stops() } });
  assert.strictEqual(saved.status, 201);
  const created = await api('POST', '/api/v1/travel-requests', {
    token,
    body: {
      routeId: saved.json.data.route.id,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-05',
      numberOfTravellers: 2,
    },
  });
  assert.strictEqual(created.status, 201);
  const requestId = created.json.data.request.id;
  const submitted = await api('POST', `/api/v1/travel-requests/${requestId}/submit`, { token });
  assert.strictEqual(submitted.status, 200);
  return requestId;
}

async function submitQuotation(agencyToken, requestId) {
  const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
    token: agencyToken,
    body: { quotationType: 'full_package', items: items(), currency: 'USD' },
  });
  assert.strictEqual(created.status, 201);
  const quotationId = created.json.data.quotation.id;
  const submitted = await api('POST', `/api/v1/agency/quotations/${quotationId}/submit`, {
    token: agencyToken,
  });
  assert.strictEqual(submitted.status, 200);
  return quotationId;
}

async function setupThread() {
  const traveller = await registerTraveller();
  const agency = await registerAgency();
  const profile = await makeEligible(agency.user.id);
  const requestId = await createSubmittedRequest(traveller.token);
  await submitQuotation(agency.token, requestId);
  const opened = await api('POST', '/api/v1/conversations', {
    token: traveller.token,
    body: { travelRequestId: requestId, agencyId: profile.id },
  });
  assert.strictEqual(opened.status, 201);
  return {
    traveller,
    agency,
    profile,
    requestId,
    conversationId: opened.json.data.conversation.id,
  };
}

function connectClient({ token } = {}) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      auth: token ? { token } : {},
      reconnection: false,
      transports: ['websocket'],
    });
    openSockets.add(socket);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => {
      openSockets.delete(socket);
      socket.close();
      reject(err);
    });
  });
}

function closeClient(socket) {
  openSockets.delete(socket);
  socket.close();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

before(async () => {
  resetSequelizeInstance();
  resetSocketServer();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for socket integration tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  models = initModels(db);
  await migrateUp(db);

  server = http.createServer(app);
  initSocketServer(server);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  clearNotificationListeners();
  try {
    for (const socket of [...openSockets]) {
      closeClient(socket);
    }
    await closeSocketServer();
    resetSocketServer();
    await new Promise((resolve) => server.close(resolve));
    if (models && ownedAgencyIds.size > 0) {
      await models.AgencyMembership.destroy({ where: { agencyId: [...ownedAgencyIds] } });
    }
    if (models && sharedPlan) {
      await models.MembershipPlan.destroy({ where: { id: sharedPlan.id } });
    }
  } finally {
    await closeDatabase();
    resetSequelizeInstance();
  }
});

describe('socket authentication', () => {
  test('unauthenticated connection is rejected', async () => {
    await assert.rejects(connectClient(), /Authentication required/);
  });

  test('invalid token is rejected', async () => {
    await assert.rejects(connectClient({ token: 'not-a-real-token' }), /Invalid access token/);
  });
});

describe('conversation rooms', () => {
  test('member joins own conversation and receives conversation:message after REST send', async () => {
    const { traveller, agency, conversationId } = await setupThread();
    const socket = await connectClient({ token: traveller.token });
    try {
      const ack = await socket.emitWithAck('conversation:join', { conversationId });
      assert.strictEqual(ack.ok, true);
      assert.strictEqual(ack.conversationId, conversationId);

      const received = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('timed out waiting for conversation:message')),
          5000,
        );
        socket.on('conversation:message', (payload) => {
          clearTimeout(timer);
          resolve(payload);
        });
      });

      const sent = await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
        token: agency.token,
        body: { body: 'Live ping from agency' },
      });
      assert.strictEqual(sent.status, 201);

      const payload = await received;
      assert.strictEqual(payload.message.body, 'Live ping from agency');
      assert.strictEqual(payload.message.conversationId, conversationId);
    } finally {
      closeClient(socket);
    }
  });

  test("joining another pair's conversation is rejected", async () => {
    const { conversationId } = await setupThread();
    const outsider = await registerTraveller();
    const socket = await connectClient({ token: outsider.token });
    try {
      const ack = await socket.emitWithAck('conversation:join', { conversationId });
      assert.strictEqual(ack.ok, false);
      assert.strictEqual(ack.code, 'NOT_FOUND');
    } finally {
      closeClient(socket);
    }
  });

  test('no token-room leaks: unjoined sockets receive nothing', async () => {
    const { agency, conversationId } = await setupThread();
    const outsider = await registerTraveller();
    const socket = await connectClient({ token: outsider.token });
    try {
      let leaked = 0;
      socket.on('conversation:message', () => {
        leaked += 1;
      });

      const sent = await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
        token: agency.token,
        body: { body: 'Private thread message' },
      });
      assert.strictEqual(sent.status, 201);

      await sleep(700);
      assert.strictEqual(leaked, 0);
    } finally {
      closeClient(socket);
    }
  });
});
