/**
 * Phase 6 integration tests (quotation acceptance + jobs).
 *
 * Full HTTP flow against the ISOLATED test database only
 * (NODE_ENV=test). Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * Covers: accept flow (quotation + request accepted, job created,
 * rivals rejected, QUOTATION_ACCEPTED/JOB_CREATED/CONTACT_REVEALED
 * events), idempotent re-accept (200), second-quotation accept
 * (409), wrong traveller (404), withdrawn quotation (400), job
 * status transitions (incl. invalid 400), and job visibility
 * (other traveller 404, admin GET 200 / PATCH 403).
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

async function registerTraveller() {
  const res = await api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Accept Tester',
      email: email('accept-traveller'),
      password: 'password-123',
      firstName: 'Accept',
      lastName: 'Tester',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

async function registerAgency(tag = 'accept-agency') {
  const res = await api('POST', '/api/v1/auth/register/agency', {
    body: {
      email: email(tag),
      password: 'password-123',
      agencyName: `Accept Agency ${suffix}-${emailCounter}`,
      contactPerson: 'Agency Owner',
      city: 'Istanbul',
      country: 'Turkiye',
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

async function registerAdmin() {
  const address = email('accept-admin');
  await createAdminUser({ email: address, name: 'Accept Admin', password: 'password-123' });
  const loggedIn = await api('POST', '/api/v1/auth/login', {
    body: { email: address, password: 'password-123' },
  });
  assert.strictEqual(loggedIn.status, 200);
  return { token: loggedIn.json.data.accessToken, user: loggedIn.json.data.user };
}

async function getSharedPlan() {
  if (!sharedPlan) {
    const tag = `phase6-accept-${suffix}`;
    sharedPlan =
      (await models.MembershipPlan.findOne({ where: { slug: tag } })) ||
      (await models.MembershipPlan.create({
        name: `Phase 6 accept ${suffix}`,
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

/** One request with two submitted quotations from two eligible agencies. */
async function setupContestedRequest() {
  const traveller = await registerTraveller();
  const agencyA = await registerAgency('accept-a');
  const agencyB = await registerAgency('accept-b');
  const profileA = await makeEligible(agencyA.user.id);
  const profileB = await makeEligible(agencyB.user.id);
  const requestId = await createSubmittedRequest(traveller.token);
  const quotationA = await submitQuotation(agencyA.token, requestId);
  const quotationB = await submitQuotation(agencyB.token, requestId);
  return { traveller, agencyA, agencyB, profileA, profileB, requestId, quotationA, quotationB };
}

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for acceptance integration tests: ${err.message}. ` +
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

describe('quotation acceptance', () => {
  test('accept flow: quotation + request accepted, job created, rivals rejected, events fire', async () => {
    const { traveller, profileA, profileB, requestId, quotationA, quotationB } =
      await setupContestedRequest();

    const events = [];
    const offs = [
      onNotificationEvent(NOTIFICATION_EVENTS.QUOTATION_ACCEPTED, (p) =>
        events.push(['accepted', p]),
      ),
      onNotificationEvent(NOTIFICATION_EVENTS.JOB_CREATED, (p) => events.push(['job', p])),
      onNotificationEvent(NOTIFICATION_EVENTS.CONTACT_REVEALED, (p) => events.push(['contact', p])),
    ];
    try {
      const res = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
        token: traveller.token,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.data.quotation.status, 'accepted');
      assert.strictEqual(res.json.data.requestStatus, 'accepted');
      assert.ok(res.json.data.job, 'a job should be created');
      assert.strictEqual(res.json.data.job.status, 'accepted');
      assert.strictEqual(res.json.data.job.quotationId, quotationA);
      assert.strictEqual(res.json.data.job.travelRequestId, requestId);
      assert.ok(
        res.json.data.quotation.agency.businessEmail,
        'acceptance reveals agency contact on the quotation',
      );

      const stored = await models.Quotation.findByPk(quotationA);
      assert.strictEqual(stored.status, 'accepted');
      const request = await models.TravelRequest.findByPk(requestId);
      assert.strictEqual(request.status, 'accepted');
      const rival = await models.Quotation.findByPk(quotationB);
      assert.strictEqual(rival.status, 'rejected');
      const job = await models.Job.findOne({ where: { quotationId: quotationA } });
      assert.ok(job);
      assert.strictEqual(job.agencyId, profileA.id);
      assert.strictEqual(job.travellerId, traveller.user.id);
      void profileB;

      assert.ok(
        events.some(([name, p]) => name === 'accepted' && p.quotationId === quotationA),
        'QUOTATION_ACCEPTED should fire',
      );
      assert.ok(
        events.some(([name, p]) => name === 'job' && p.quotationId === quotationA),
        'JOB_CREATED should fire',
      );
      assert.ok(
        events.some(([name, p]) => name === 'contact' && p.travelRequestId === requestId),
        'CONTACT_REVEALED should fire',
      );
    } finally {
      offs.forEach((off) => off());
    }
  });

  test('re-accepting the accepted quotation is idempotent (200, same job)', async () => {
    const { traveller, quotationA } = await setupContestedRequest();
    const first = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(first.status, 200);
    const second = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(second.status, 200);
    assert.strictEqual(second.json.data.job.id, first.json.data.job.id);
    const jobs = await models.Job.count({ where: { quotationId: quotationA } });
    assert.strictEqual(jobs, 1);
  });

  test('accepting a second quotation on an accepted request → 409', async () => {
    const { traveller, requestId, quotationA, quotationB } = await setupContestedRequest();
    const first = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(first.status, 200);
    // The rival was auto-rejected; restore it to submitted to exercise
    // the already-accepted guard (a second live quotation).
    await models.Quotation.update({ status: 'submitted' }, { where: { id: quotationB } });
    const request = await models.TravelRequest.findByPk(requestId);
    assert.strictEqual(request.status, 'accepted');
    const second = await api('POST', `/api/v1/quotations/${quotationB}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(second.status, 409);
  });

  test('another traveller gets 404 (no existence leak)', async () => {
    const { quotationA } = await setupContestedRequest();
    const outsider = await registerTraveller();
    const res = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: outsider.token,
    });
    assert.strictEqual(res.status, 404);
  });

  test('withdrawn quotation cannot be accepted (400)', async () => {
    const traveller = await registerTraveller();
    const agency = await registerAgency('accept-withdraw');
    await makeEligible(agency.user.id);
    const requestId = await createSubmittedRequest(traveller.token);
    const created = await api('POST', `/api/v1/agency/travel-requests/${requestId}/quotations`, {
      token: agency.token,
      body: { quotationType: 'hotel_only', items: items() },
    });
    const quotationId = created.json.data.quotation.id;
    const withdrawn = await api('POST', `/api/v1/agency/quotations/${quotationId}/withdraw`, {
      token: agency.token,
    });
    assert.strictEqual(withdrawn.status, 200);
    const res = await api('POST', `/api/v1/quotations/${quotationId}/accept`, {
      token: traveller.token,
    });
    assert.strictEqual(res.status, 400);
  });
});

describe('job status transitions', () => {
  test('accepted → in_progress → completed', async () => {
    const { traveller, quotationA } = await setupContestedRequest();
    const accepted = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    const jobId = accepted.json.data.job.id;

    const started = await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
      token: traveller.token,
      body: { status: 'in_progress' },
    });
    assert.strictEqual(started.status, 200);
    assert.strictEqual(started.json.data.job.status, 'in_progress');
    assert.ok(started.json.data.job.startedAt);

    const done = await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
      token: traveller.token,
      body: { status: 'completed' },
    });
    assert.strictEqual(done.status, 200);
    assert.strictEqual(done.json.data.job.status, 'completed');
    assert.ok(done.json.data.job.completedAt);
  });

  test('accepted → cancelled, and invalid transitions → 400', async () => {
    const { traveller, agencyA, quotationA } = await setupContestedRequest();
    const accepted = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    const jobId = accepted.json.data.job.id;

    // Skipping straight to completed is invalid from accepted.
    assert.strictEqual(
      (
        await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
          token: traveller.token,
          body: { status: 'completed' },
        })
      ).status,
      400,
    );
    // Unknown enum values are rejected by validation.
    assert.strictEqual(
      (
        await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
          token: traveller.token,
          body: { status: 'archived' },
        })
      ).status,
      400,
    );

    // The winning agency can drive the transition too.
    const cancelled = await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
      token: agencyA.token,
      body: { status: 'cancelled' },
    });
    assert.strictEqual(cancelled.status, 200);
    assert.strictEqual(cancelled.json.data.job.status, 'cancelled');

    // Terminal states have no outgoing transitions.
    assert.strictEqual(
      (
        await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
          token: traveller.token,
          body: { status: 'in_progress' },
        })
      ).status,
      400,
    );
  });
});

describe('job visibility', () => {
  test('other traveller gets 404; admin GET 200 / PATCH 403', async () => {
    const { traveller, agencyA, agencyB, quotationA } = await setupContestedRequest();
    const accepted = await api('POST', `/api/v1/quotations/${quotationA}/accept`, {
      token: traveller.token,
    });
    const jobId = accepted.json.data.job.id;

    const outsider = await registerTraveller();
    assert.strictEqual(
      (await api('GET', `/api/v1/jobs/${jobId}`, { token: outsider.token })).status,
      404,
    );
    assert.strictEqual(
      (
        await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
          token: outsider.token,
          body: { status: 'cancelled' },
        })
      ).status,
      404,
    );

    // Losing agency is not a participant either.
    assert.strictEqual(
      (await api('GET', `/api/v1/jobs/${jobId}`, { token: agencyB.token })).status,
      404,
    );

    // Participants can read.
    assert.strictEqual(
      (await api('GET', `/api/v1/jobs/${jobId}`, { token: agencyA.token })).status,
      200,
    );
    const listed = await api('GET', '/api/v1/jobs', { token: traveller.token });
    assert.strictEqual(listed.status, 200);
    assert.ok(listed.json.data.jobs.some((j) => j.id === jobId));

    const admin = await registerAdmin();
    assert.strictEqual(
      (await api('GET', `/api/v1/jobs/${jobId}`, { token: admin.token })).status,
      200,
    );
    assert.strictEqual(
      (
        await api('PATCH', `/api/v1/jobs/${jobId}/status`, {
          token: admin.token,
          body: { status: 'cancelled' },
        })
      ).status,
      403,
    );
  });
});
