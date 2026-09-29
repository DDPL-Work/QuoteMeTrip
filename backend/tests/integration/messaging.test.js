/**
 * Phase 6 integration tests (messaging + contact visibility).
 *
 * Full HTTP flow against the ISOLATED test database only
 * (NODE_ENV=test). Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * Covers: conversation open (traveller + agency paths), duplicate
 * prevention (201 then 200), stranger isolation (404), send/read
 * messages, mark-read, contact hidden pre-acceptance (firstName
 * only + masked bodies) → revealed post-acceptance (email/phone +
 * unmasked bodies), and admin read-only (GET 200, POST/PATCH 403).
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';
process.env.JWT_ACCESS_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';

import app from '../../src/app.js';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import { createAdminUser } from '../../src/modules/auth/auth.service.js';
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

async function registerTraveller(overrides = {}) {
  const address = email('msg-traveller');
  const res = await api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Msg Tester',
      email: address,
      password: 'password-123',
      firstName: 'Msg',
      lastName: 'Tester',
      phone: '+905551110001',
      ...overrides,
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user, email: address };
}

async function registerAgency(tag = 'msg-agency') {
  const address = email(tag);
  const res = await api('POST', '/api/v1/auth/register/agency', {
    body: {
      email: address,
      password: 'password-123',
      agencyName: `Msg Agency ${suffix}-${emailCounter}`,
      contactPerson: 'Agency Owner',
      city: 'Istanbul',
      country: 'Turkiye',
      phone: '+905552220002',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user, email: address };
}

async function registerAdmin() {
  const address = email('msg-admin');
  await createAdminUser({ email: address, name: 'Msg Admin', password: 'password-123' });
  const loggedIn = await api('POST', '/api/v1/auth/login', {
    body: { email: address, password: 'password-123' },
  });
  assert.strictEqual(loggedIn.status, 200);
  return { token: loggedIn.json.data.accessToken, user: loggedIn.json.data.user };
}

async function getSharedPlan() {
  if (!sharedPlan) {
    const tag = `phase6-msg-${suffix}`;
    sharedPlan =
      (await models.MembershipPlan.findOne({ where: { slug: tag } })) ||
      (await models.MembershipPlan.create({
        name: `Phase 6 msg ${suffix}`,
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
  await profile.update({
    status: 'approved',
    businessEmail: `biz-${profile.id}@example.com`,
  });
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
  const quotationId = await submitQuotation(agency.token, requestId);
  return { traveller, agency, profile, requestId, quotationId };
}

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for messaging integration tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  models = initModels(db);
  await migrateUp(db);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  clearNotificationListeners();
  try {
    if (models && ownedAgencyIds.size > 0) {
      await models.AgencyMembership.destroy({ where: { agencyId: [...ownedAgencyIds] } });
    }
    if (models && sharedPlan) {
      await models.MembershipPlan.destroy({ where: { id: sharedPlan.id } });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await closeDatabase();
    resetSequelizeInstance();
  }
});

describe('conversation creation', () => {
  test('traveller opens a conversation with the quoting agency (201)', async () => {
    const { traveller, profile, requestId } = await setupThread();
    const res = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.json.data.conversation.id);
    assert.strictEqual(res.json.data.conversation.travelRequestId, requestId);
    assert.strictEqual(res.json.data.conversation.status, 'active');
    assert.strictEqual(res.json.data.conversation.contactRevealed, false);
  });

  test('agency opens a conversation for a matched request (201, no agencyId needed)', async () => {
    const { agency, requestId } = await setupThread();
    const res = await api('POST', '/api/v1/conversations', {
      token: agency.token,
      body: { travelRequestId: requestId },
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.json.data.conversation.id);
  });

  test('duplicate triple returns 200 with the existing conversation', async () => {
    const { traveller, profile, requestId } = await setupThread();
    const first = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(first.status, 201);
    const second = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(second.status, 200);
    assert.strictEqual(second.json.data.conversation.id, first.json.data.conversation.id);
  });

  test('traveller cannot message an agency that never quoted (400)', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('no-quote');
    const profile = await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);
    const res = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(res.status, 400);
  });
});

describe('conversation access control', () => {
  test("stranger traveller gets 404 on another pair's conversation", async () => {
    const { traveller, profile, requestId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;

    const outsider = await registerTraveller();
    assert.strictEqual(
      (await api('GET', `/api/v1/conversations/${conversationId}`, { token: outsider.token }))
        .status,
      404,
    );
    assert.strictEqual(
      (
        await api('GET', `/api/v1/conversations/${conversationId}/messages`, {
          token: outsider.token,
        })
      ).status,
      404,
    );
    assert.strictEqual(
      (
        await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
          token: outsider.token,
          body: { body: 'hijack' },
        })
      ).status,
      404,
    );
  });

  test('list is role-scoped: members see it, outsiders do not', async () => {
    const { traveller, agency, profile, requestId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;

    const mine = await api('GET', '/api/v1/conversations', { token: traveller.token });
    assert.strictEqual(mine.status, 200);
    assert.ok(mine.json.data.conversations.some((c) => c.id === conversationId));

    const inbox = await api('GET', '/api/v1/conversations', { token: agency.token });
    assert.strictEqual(inbox.status, 200);
    assert.ok(inbox.json.data.conversations.some((c) => c.id === conversationId));

    const outsider = await registerTraveller();
    const foreign = await api('GET', '/api/v1/conversations', { token: outsider.token });
    assert.strictEqual(foreign.status, 200);
    assert.ok(!foreign.json.data.conversations.some((c) => c.id === conversationId));
  });
});

describe('send and read messages', () => {
  test('members exchange messages (ASC history) and mark read', async () => {
    const { traveller, agency, profile, requestId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;

    const sent = await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
      token: traveller.token,
      body: { body: 'Hello, is October available?' },
    });
    assert.strictEqual(sent.status, 201);
    assert.strictEqual(sent.json.data.message.body, 'Hello, is October available?');

    const reply = await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
      token: agency.token,
      body: { body: 'Yes, we have availability.' },
    });
    assert.strictEqual(reply.status, 201);

    const history = await api('GET', `/api/v1/conversations/${conversationId}/messages`, {
      token: traveller.token,
    });
    assert.strictEqual(history.status, 200);
    assert.strictEqual(history.json.data.messages.length, 2);
    assert.ok(
      history.json.data.messages[0].id < history.json.data.messages[1].id,
      'history should be oldest-first',
    );
    assert.strictEqual(history.json.data.messages[0].body, 'Hello, is October available?');

    const read = await api('PATCH', `/api/v1/conversations/${conversationId}/read`, {
      token: agency.token,
    });
    assert.strictEqual(read.status, 200);
    assert.strictEqual(read.json.data.marked, 1);
  });

  test('empty and oversize bodies are rejected (400)', async () => {
    const { traveller, profile, requestId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;

    assert.strictEqual(
      (
        await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
          token: traveller.token,
          body: { body: '   ' },
        })
      ).status,
      400,
    );
    assert.strictEqual(
      (
        await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
          token: traveller.token,
          body: { body: 'x'.repeat(5001) },
        })
      ).status,
      400,
    );
  });
});

describe('contact visibility across acceptance', () => {
  test('hidden pre-acceptance → revealed post-acceptance', async () => {
    const { traveller, agency, profile, requestId, quotationId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;

    const planted = 'Call me at adminder@example.com or +90 555 999 8877 please';
    await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
      token: agency.token,
      body: { body: planted },
    });

    const before = await api('GET', `/api/v1/conversations/${conversationId}`, {
      token: traveller.token,
    });
    assert.strictEqual(before.status, 200);
    assert.strictEqual(before.json.data.conversation.contactRevealed, false);
    assert.deepStrictEqual(Object.keys(before.json.data.conversation.traveller).sort(), [
      'firstName',
    ]);
    assert.ok(!('businessEmail' in before.json.data.conversation.agency));
    assert.ok(!('phone' in before.json.data.conversation.agency));

    const historyBefore = await api('GET', `/api/v1/conversations/${conversationId}/messages`, {
      token: traveller.token,
    });
    const plantedBefore = historyBefore.json.data.messages.find((m) => m.body.includes('please'));
    assert.ok(plantedBefore, 'planted message should be in history');
    assert.ok(!plantedBefore.body.includes('adminder@example.com'));
    assert.ok(!plantedBefore.body.includes('555'), 'phone digits should be masked');
    assert.ok(plantedBefore.body.includes('[hidden contact]'));

    const accepted = await api('POST', `/api/v1/quotations/${quotationId}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(accepted.status, 200);

    const after = await api('GET', `/api/v1/conversations/${conversationId}`, {
      token: traveller.token,
    });
    assert.strictEqual(after.json.data.conversation.contactRevealed, true);
    assert.strictEqual(after.json.data.conversation.traveller.email, traveller.email);
    assert.strictEqual(after.json.data.conversation.traveller.phone, '+905551110001');
    assert.strictEqual(
      after.json.data.conversation.agency.businessEmail,
      `biz-${profile.id}@example.com`,
    );
    assert.strictEqual(after.json.data.conversation.agency.phone, '+905552220002');

    const historyAfter = await api('GET', `/api/v1/conversations/${conversationId}/messages`, {
      token: traveller.token,
    });
    const plantedAfter = historyAfter.json.data.messages.find((m) => m.body.includes('please'));
    assert.ok(plantedAfter.body.includes('adminder@example.com'));
    assert.ok(plantedAfter.body.includes('555'));
    void agency;
  });
});

describe('admin read-only access', () => {
  test('admin GET 200, POST/PATCH 403', async () => {
    const { traveller, profile, requestId } = await setupThread();
    const opened = await api('POST', '/api/v1/conversations', {
      token: traveller.token,
      body: { travelRequestId: requestId, agencyId: profile.id },
    });
    const conversationId = opened.json.data.conversation.id;
    const admin = await registerAdmin();

    assert.strictEqual(
      (await api('GET', `/api/v1/conversations/${conversationId}`, { token: admin.token })).status,
      200,
    );
    assert.strictEqual(
      (
        await api('GET', `/api/v1/conversations/${conversationId}/messages`, {
          token: admin.token,
        })
      ).status,
      200,
    );
    assert.strictEqual(
      (
        await api('POST', `/api/v1/conversations/${conversationId}/messages`, {
          token: admin.token,
          body: { body: 'admin says hi' },
        })
      ).status,
      403,
    );
    assert.strictEqual(
      (await api('PATCH', `/api/v1/conversations/${conversationId}/read`, { token: admin.token }))
        .status,
      403,
    );
  });
});
