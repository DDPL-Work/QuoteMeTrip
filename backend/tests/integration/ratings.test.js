import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';

import assert from 'node:assert';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import app from '../../src/app.js';
import { getSequelize, closeDatabase } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';

let server;
let baseUrl;
let db;

async function api(method, path, { token = null, body = null } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('Ratings Integration Test Suite', async (t) => {
  before(async () => {
    db = getSequelize();
    await migrateUp(db);
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('Complete Rating Lifecycle', async () => {
    const models = initModels();
    const suffix = Date.now().toString(36);

    // Register traveller & agency via API
    const travellerRes = await api('POST', '/api/v1/auth/register/traveller', {
      body: {
        email: `traveller_${suffix}@example.com`,
        password: 'Password123!',
        name: 'Rating Traveller',
        firstName: 'Rating',
        lastName: 'Traveller',
      },
    });
    assert.strictEqual(travellerRes.status, 201);
    const travellerAuth = travellerRes.json.data;

    const agencyRes = await api('POST', '/api/v1/auth/register/agency', {
      body: {
        email: `agency_${suffix}@corporatetest.com`,
        password: 'Password123!',
        name: 'Agency Admin',
        agencyName: 'Rating Test Agency',
        city: 'Istanbul',
        country: 'Turkey',
      },
    });
    assert.strictEqual(agencyRes.status, 201);
    const agencyAuth = agencyRes.json.data;

    const agencyProfile = await models.AgencyProfile.findOne({
      where: { userId: agencyAuth.user.id },
    });
    await agencyProfile.update({ status: 'approved' });

    // Create a job directly in DB for testing
    const route = await models.Route.create({
      travellerId: travellerAuth.user.id,
      startLocation: 'Istanbul',
      finalDestination: 'Ankara',
      totalDistanceKm: 450,
      estimatedDurationMinutes: 300,
    });

    const request = await models.TravelRequest.create({
      travellerId: travellerAuth.user.id,
      routeId: route.id,
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
      budgetTotal: 1000,
      currency: 'USD',
      status: 'accepted',
    });

    const quotation = await models.Quotation.create({
      travelRequestId: request.id,
      agencyId: agencyProfile.id,
      quotationType: 'full_package',
      priceTotal: 900,
      currency: 'USD',
      validUntil: '2026-12-01',
      status: 'accepted',
    });

    const job = await models.Job.create({
      travelRequestId: request.id,
      quotationId: quotation.id,
      travellerId: travellerAuth.user.id,
      agencyId: agencyProfile.id,
      status: 'accepted',
    });

    // 1. Attempt rating on non-completed job -> must fail (400)
    const prematureRes = await api('POST', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
      body: { rating: 5 },
    });
    assert.strictEqual(prematureRes.status, 400);

    // 2. Transition job to completed
    await job.update({ status: 'completed', completedAt: new Date() });

    // 3. Attempt rating with invalid score (<1 or >5) -> must fail (400)
    const invalidLow = await api('POST', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
      body: { rating: 0 },
    });
    assert.strictEqual(invalidLow.status, 400);

    const invalidHigh = await api('POST', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
      body: { rating: 6 },
    });
    assert.strictEqual(invalidHigh.status, 400);

    // 4. Submit valid rating (5 stars)
    const validRes = await api('POST', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
      body: { rating: 5 },
    });
    assert.strictEqual(validRes.status, 201);
    assert.strictEqual(validRes.json.data.rating, 5);

    // 5. Attempt duplicate rating -> must fail (400)
    const duplicateRes = await api('POST', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
      body: { rating: 4 },
    });
    assert.strictEqual(duplicateRes.status, 400);

    // 6. Fetch rating for job
    const getRes = await api('GET', `/api/v1/jobs/${job.id}/rating`, {
      token: travellerAuth.accessToken,
    });
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.json.data.rating, 5);

    // 7. Agency rating summary
    const summaryRes = await api('GET', `/api/v1/agencies/${agencyProfile.id}/rating-summary`);
    assert.strictEqual(summaryRes.status, 200);
    assert.strictEqual(summaryRes.json.data.averageRating, 5);
    assert.strictEqual(summaryRes.json.data.ratingCount, 1);
  });
});
