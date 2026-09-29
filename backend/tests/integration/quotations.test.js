/**
 * Phase 5 integration tests (agency matching + quotations).
 *
 * Full HTTP flow against the ISOLATED test database only
 * (NODE_ENV=test). Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * Covers: submit → agency matches, eligibility exclusions
 * (inactive membership, suspended profile, inactive user), agency
 * inbox envelope + isolation, quotation draft → edit → submit,
 * server-computed totals, traveller quotation visibility with
 * contact protection, and duplicate/active-quotation guards.
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
import {
  NOTIFICATION_EVENTS,
  onNotificationEvent,
  clearNotificationListeners,
} from '../../src/modules/notifications/notification-events.js';

const suffix = Date.now().toString(36);
let emailCounter = 0;
const email = (name) => `${name}+${suffix}-${emailCounter++}@example.com`;

let db;
let models;
let server;
let baseUrl;

// Single plan shared by every agency in this file (keeps the
// membership_plans table tidy; removed in after() so later suites
// such as seeders.test.js observe a clean table).
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

async function api(method, path, { body, token, query } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = query ? `${baseUrl}${path}?${new URLSearchParams(query)}` : `${baseUrl}${path}`;
  const res = await fetch(url, {
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
      name: 'Quote Tester',
      email: email('traveller'),
      password: 'password-123',
      firstName: 'Quote',
      lastName: 'Tester',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

async function registerAgency(tag = 'agency') {
  const res = await api('POST', '/api/v1/auth/register/agency', {
    body: {
      email: email(tag),
      password: 'password-123',
      agencyName: `Agency ${suffix}-${emailCounter}`,
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
    const tag = `phase5-${suffix}`;
    sharedPlan =
      (await models.MembershipPlan.findOne({ where: { slug: tag } })) ||
      (await models.MembershipPlan.create({
        name: `Phase 5 ${suffix}`,
        slug: tag,
        price: 10,
        currency: 'USD',
        durationDays: 30,
      }));
  }
  return sharedPlan;
}

/**
 * Make a freshly registered agency match-eligible: approved profile
 * + active membership window. Registration alone creates neither.
 */
async function makeEligible(userId, { membershipStatus = 'active', endsAt = null } = {}) {
  const profile = await models.AgencyProfile.findOne({ where: { userId } });
  assert.ok(profile, 'agency profile should exist after registration');
  await profile.update({ status: 'approved' });
  const plan = await getSharedPlan();
  await models.AgencyMembership.create({
    agencyId: profile.id,
    planId: plan.id,
    status: membershipStatus,
    startsAt: new Date(Date.now() - 60_000),
    endsAt,
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

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for quotation integration tests: ${err.message}. ` +
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
    // Remove this file's memberships + shared plan so later suites
    // (e.g. seeders.test.js plan counts) observe a clean table.
    // Memberships must go first (plans are ON DELETE RESTRICT).
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

describe('agency matching on submit', () => {
  test('submitted request creates agency matches + emits REQUEST_MATCHED', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('eligible');
    const profile = await makeEligible(agency.user.id);

    const events = [];
    const off = onNotificationEvent(NOTIFICATION_EVENTS.REQUEST_MATCHED, (payload) => {
      events.push(payload);
    });
    try {
      const requestId = await createSubmittedRequest(traveller.token);

      const match = await models.TravelRequestAgency.findOne({
        where: { travelRequestId: requestId, agencyId: profile.id },
      });
      assert.ok(match, 'eligible agency should have a match row');
      assert.strictEqual(match.matchStatus, 'matched');

      assert.ok(
        events.some((e) => e.travelRequestId === requestId && e.agencyId === profile.id),
        'REQUEST_MATCHED should fire post-commit for the new match',
      );
    } finally {
      off();
    }
  });

  test('agency with an inactive membership is excluded from matching', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('inactive-member');
    const profile = await makeEligible(agency.user.id, { membershipStatus: 'expired' });

    const requestId = await createSubmittedRequest(traveller.token);
    const match = await models.TravelRequestAgency.findOne({
      where: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(match, null);
  });

  test('suspended agency profile is excluded from matching', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('suspended');
    const profile = await makeEligible(agency.user.id);
    await profile.update({ status: 'suspended' });

    const requestId = await createSubmittedRequest(traveller.token);
    const match = await models.TravelRequestAgency.findOne({
      where: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(match, null);
  });

  test('agency with an inactive user is excluded from matching', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('inactive-user');
    const profile = await makeEligible(agency.user.id);
    await models.User.update({ status: 'inactive' }, { where: { id: agency.user.id } });

    const requestId = await createSubmittedRequest(traveller.token);
    const match = await models.TravelRequestAgency.findOne({
      where: { travelRequestId: requestId, agencyId: profile.id },
    });
    assert.strictEqual(match, null);
  });
});

describe('agency inbox', () => {
  test('inbox lists the matched request with pagination envelope', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('inbox');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);

    const inbox = await api('GET', '/api/v1/agency/travel-requests', { token: agency.token });
    assert.strictEqual(inbox.status, 200);
    assert.ok(Array.isArray(inbox.json.data.requests));
    assert.ok(inbox.json.data.requests.some((r) => r.id === requestId));
    assert.ok(inbox.json.pagination);
    assert.strictEqual(typeof inbox.json.pagination.totalItems, 'number');
    assert.strictEqual(typeof inbox.json.pagination.totalPages, 'number');

    const detail = await api('GET', `/api/v1/agency/travel-requests/${requestId}`, {
      token: agency.token,
    });
    assert.strictEqual(detail.status, 200);
    assert.strictEqual(detail.json.data.request.id, requestId);
    assert.ok(detail.json.data.request.match);
  });

  test('unmatched agency gets 404 on request detail (no existence leak)', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('inbox-eligible');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);

    const outsider = await registerAgency('outsider');
    const detail = await api('GET', `/api/v1/agency/travel-requests/${requestId}`, {
      token: outsider.token,
    });
    assert.strictEqual(detail.status, 404);
  });
});

describe('agency quotations', () => {
  async function setupMatchedPair() {
    const traveller = await registerTraveller();
    const agency = await registerAgency('quoting');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);
    return { traveller, agency, requestId };
  }

  test('draft create uses server-computed totals; client totals → 400', async () => {
    const { agency, requestId } = await setupMatchedPair();

    const rejected = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'full_package', items: items(), totalAmount: 1 },
    });
    assert.strictEqual(rejected.status, 400);

    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'full_package', items: items(), currency: 'USD' },
    });
    assert.strictEqual(created.status, 201);
    const quotation = created.json.data.quotation;
    assert.strictEqual(quotation.status, 'draft');
    // 2×100 + 1×49.99, calculated server-side.
    assert.strictEqual(quotation.subtotal, 249.99);
    assert.strictEqual(quotation.totalAmount, 249.99);
    assert.strictEqual(quotation.items.length, 2);
  });

  test('edit draft → submit → match quoted + QUOTATION_SUBMITTED event', async () => {
    const { agency, requestId } = await setupMatchedPair();

    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    const quotationId = created.json.data.quotation.id;

    const patched = await api('PATCH', `/api/v1/agency/quotations/${quotationId}`, {
      token: agency.token,
      body: {
        notes: 'Updated notes',
        items: [{ title: 'Hotel stay', itemType: 'hotel', quantity: 3, unitPrice: 100 }],
      },
    });
    assert.strictEqual(patched.status, 200);
    assert.strictEqual(patched.json.data.quotation.notes, 'Updated notes');
    assert.strictEqual(patched.json.data.quotation.subtotal, 300);

    const events = [];
    const off = onNotificationEvent(NOTIFICATION_EVENTS.QUOTATION_SUBMITTED, (payload) => {
      events.push(payload);
    });
    try {
      const submitted = await api('POST', `/api/v1/agency/quotations/${quotationId}/submit`, {
        token: agency.token,
      });
      assert.strictEqual(submitted.status, 200);
      assert.strictEqual(submitted.json.data.quotation.status, 'submitted');
      assert.ok(
        events.some((e) => e.quotationId === quotationId),
        'QUOTATION_SUBMITTED should fire on submit',
      );
    } finally {
      off();
    }

    const agencyProfile = await models.AgencyProfile.findOne({ where: { userId: agency.user.id } });
    const match = await models.TravelRequestAgency.findOne({
      where: { travelRequestId: requestId, agencyId: agencyProfile.id },
    });
    assert.strictEqual(match.matchStatus, 'quoted');

    const editAfterSubmit = await api('PATCH', `/api/v1/agency/quotations/${quotationId}`, {
      token: agency.token,
      body: { notes: 'Too late' },
    });
    assert.strictEqual(editAfterSubmit.status, 400);

    const resubmit = await api('POST', `/api/v1/agency/quotations/${quotationId}/submit`, {
      token: agency.token,
    });
    assert.strictEqual(resubmit.status, 400);
  });

  test('duplicate active quotation → 409', async () => {
    const { agency, requestId } = await setupMatchedPair();

    const first = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    assert.strictEqual(first.status, 201);

    const second = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    assert.strictEqual(second.status, 409);
  });

  test('agency cannot modify another agency’s quotation (404)', async () => {
    const { agency, requestId } = await setupMatchedPair();
    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    const quotationId = created.json.data.quotation.id;

    const other = await registerAgency('other-agency');
    const patched = await api('PATCH', `/api/v1/agency/quotations/${quotationId}`, {
      token: other.token,
      body: { notes: 'Hijack' },
    });
    assert.strictEqual(patched.status, 404);

    const fetched = await api('GET', `/api/v1/agency/quotations/${quotationId}`, {
      token: other.token,
    });
    assert.strictEqual(fetched.status, 404);
  });
});

describe('traveller quotations', () => {
  test('traveller lists own submitted quotations with protected agency snippet', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('visible');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);

    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'full_package', items: items() },
    });
    const quotationId = created.json.data.quotation.id;

    // Drafts stay hidden from travellers until submitted.
    const before = await api('GET', `/api/v1/travel-requests/${requestId}/quotations`, {
      token: traveller.token,
    });
    assert.strictEqual(before.status, 200);
    assert.deepStrictEqual(before.json.data.quotations, []);

    await api('POST', `/api/v1/agency/quotations/${quotationId}/submit`, { token: agency.token });

    const listed = await api('GET', `/api/v1/travel-requests/${requestId}/quotations`, {
      token: traveller.token,
    });
    assert.strictEqual(listed.status, 200);
    assert.strictEqual(listed.json.data.quotations.length, 1);
    const shown = listed.json.data.quotations[0];
    assert.strictEqual(shown.id, quotationId);
    assert.ok(shown.agency, 'traveller view should include the agency snippet');
    assert.ok(shown.agency.agencyName, 'snippet should carry the business name');
    assert.ok(!('email' in shown.agency), 'snippet must not leak email');
    assert.ok(!('phone' in shown.agency), 'snippet must not leak phone');

    const detail = await api('GET', `/api/v1/quotations/${quotationId}`, {
      token: traveller.token,
    });
    assert.strictEqual(detail.status, 200);
    assert.strictEqual(detail.json.data.quotation.id, quotationId);
  });

  test('traveller cannot see another traveller’s quotations (404)', async () => {
    const first = await registerTraveller();
    const second = await registerTraveller();
    const agency = await registerAgency('shared');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(first.token);

    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    const quotationId = created.json.data.quotation.id;
    await api('POST', `/api/v1/agency/quotations/${quotationId}/submit`, { token: agency.token });

    const foreignList = await api('GET', `/api/v1/travel-requests/${requestId}/quotations`, {
      token: second.token,
    });
    assert.strictEqual(foreignList.status, 404);

    const foreignDetail = await api('GET', `/api/v1/quotations/${quotationId}`, {
      token: second.token,
    });
    assert.strictEqual(foreignDetail.status, 404);
  });
});
