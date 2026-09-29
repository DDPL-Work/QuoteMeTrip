/**
 * Traveller core workflow integration tests (Phase 4).
 *
 * Full HTTP flow against the ISOLATED test database only
 * (NODE_ENV=test). Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * Covers: profile GET/PATCH, route calculate/save/retrieve, draft
 * create/update/add-day/submit/retrieve, cross-owner isolation
 * (404), cancel flow, invalid transitions, inline-route creation.
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

const suffix = Date.now().toString(36);
let emailCounter = 0;
const email = (name) => `${name}+${suffix}-${emailCounter++}@example.com`;

let db;
let models;
let server;
let baseUrl;

const stops = () => [
  { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
  { name: 'Bolu', latitude: 40.7333, longitude: 31.6, type: 'intermediate' },
  { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, type: 'final' },
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
  const res = await api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Travel Tester',
      email: email('travel'),
      password: 'password-123',
      firstName: 'Travel',
      lastName: 'Tester',
      ...overrides,
    },
  });
  assert.strictEqual(res.status, 201);
  return { token: res.json.data.accessToken, user: res.json.data.user };
}

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for travel integration tests: ${err.message}. ` +
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
  await new Promise((resolve) => server.close(resolve));
  await closeDatabase();
  resetSequelizeInstance();
});

describe('traveller profile', () => {
  test('GET /me returns the profile, PATCH /me updates it', async () => {
    const { token } = await registerTraveller();

    const got = await api('GET', '/api/v1/travellers/me', { token });
    assert.strictEqual(got.status, 200);
    assert.strictEqual(got.json.success, true);
    assert.ok(got.json.data.profile);
    assert.strictEqual(got.json.data.profile.firstName, 'Travel');

    const patched = await api('PATCH', '/api/v1/travellers/me', {
      token,
      body: { city: 'Istanbul', country: 'Turkiye' },
    });
    assert.strictEqual(patched.status, 200);
    assert.strictEqual(patched.json.data.profile.city, 'Istanbul');
    assert.strictEqual(patched.json.data.profile.country, 'Turkiye');
  });
});

describe('routes', () => {
  test('calculate → save → retrieve round trip', async () => {
    const { token } = await registerTraveller();

    const calculated = await api('POST', '/api/v1/routes/calculate', {
      token,
      body: { stops: stops() },
    });
    assert.strictEqual(calculated.status, 200);
    assert.strictEqual(calculated.json.success, true);
    assert.ok(calculated.json.data.route.distanceKm >= 0);
    assert.ok(calculated.json.data.route.recommendedDays >= 1);

    const saved = await api('POST', '/api/v1/routes', {
      token,
      body: { stops: stops() },
    });
    assert.strictEqual(saved.status, 201);
    const routeId = saved.json.data.route.id;
    assert.ok(routeId);
    assert.strictEqual(saved.json.data.route.stops.length, 3);

    const retrieved = await api('GET', `/api/v1/routes/${routeId}`, { token });
    assert.strictEqual(retrieved.status, 200);
    assert.strictEqual(retrieved.json.data.route.id, routeId);
    assert.strictEqual(retrieved.json.data.route.startLocation, 'Istanbul');
    assert.strictEqual(retrieved.json.data.route.finalDestination, 'Ankara');
  });
});

describe('travel requests', () => {
  test('draft → update → add day → submit → retrieve', async () => {
    const { token } = await registerTraveller();

    const saved = await api('POST', '/api/v1/routes', {
      token,
      body: { stops: stops() },
    });
    assert.strictEqual(saved.status, 201);
    const routeId = saved.json.data.route.id;

    const created = await api('POST', '/api/v1/travel-requests', {
      token,
      body: {
        routeId,
        travelStartDate: '2026-10-01',
        travelEndDate: '2026-10-05',
        numberOfTravellers: 2,
        days: [{ dayNumber: 1, date: '2026-10-01', location: 'Istanbul' }],
      },
    });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.json.data.request.status, 'draft');
    const requestId = created.json.data.request.id;

    const updated = await api('PATCH', `/api/v1/travel-requests/${requestId}`, {
      token,
      body: { numberOfTravellers: 3 },
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.json.data.request.numberOfTravellers, 3);

    const added = await api('POST', `/api/v1/travel-requests/${requestId}/days`, {
      token,
      body: { dayNumber: 2, date: '2026-10-02', location: 'Ankara' },
    });
    assert.strictEqual(added.status, 201);
    assert.strictEqual(added.json.data.day.dayNumber, 2);

    const submitted = await api('POST', `/api/v1/travel-requests/${requestId}/submit`, {
      token,
    });
    assert.strictEqual(submitted.status, 200);
    assert.strictEqual(submitted.json.data.request.status, 'submitted');

    const retrieved = await api('GET', `/api/v1/travel-requests/${requestId}`, { token });
    assert.strictEqual(retrieved.status, 200);
    assert.strictEqual(retrieved.json.data.request.status, 'submitted');
    assert.strictEqual(retrieved.json.data.request.days.length, 2);

    // Regression: list must order by updated_at even with joined
    // route + day includes (bare 'updatedAt' emits an unknown column).
    const listed = await api('GET', '/api/v1/travel-requests', { token });
    assert.strictEqual(listed.status, 200);
    assert.ok(Array.isArray(listed.json.data.requests));
    assert.ok(listed.json.data.requests.some((r) => r.id === requestId));
  });

  test('second traveller cannot access the first traveller route/request (404)', async () => {
    const first = await registerTraveller();
    const second = await registerTraveller();

    const saved = await api('POST', '/api/v1/routes', {
      token: first.token,
      body: { stops: stops() },
    });
    const routeId = saved.json.data.route.id;

    const created = await api('POST', '/api/v1/travel-requests', {
      token: first.token,
      body: { routeId, travelStartDate: '2026-11-01', travelEndDate: '2026-11-03' },
    });
    const requestId = created.json.data.request.id;

    const foreignRoute = await api('GET', `/api/v1/routes/${routeId}`, {
      token: second.token,
    });
    assert.strictEqual(foreignRoute.status, 404);

    const foreignRequest = await api('GET', `/api/v1/travel-requests/${requestId}`, {
      token: second.token,
    });
    assert.strictEqual(foreignRequest.status, 404);
  });

  test('cancel flow and invalid transitions', async () => {
    const { token } = await registerTraveller();

    const saved = await api('POST', '/api/v1/routes', {
      token,
      body: { stops: stops() },
    });
    const routeId = saved.json.data.route.id;

    // Cancel a draft directly.
    const draft = await api('POST', '/api/v1/travel-requests', {
      token,
      body: { routeId, travelStartDate: '2026-12-01', travelEndDate: '2026-12-04' },
    });
    const draftId = draft.json.data.request.id;
    const cancelled = await api('POST', `/api/v1/travel-requests/${draftId}/cancel`, {
      token,
    });
    assert.strictEqual(cancelled.status, 200);
    assert.strictEqual(cancelled.json.data.request.status, 'cancelled');

    // Submit, then submit again -> 400 invalid transition.
    const second = await api('POST', '/api/v1/travel-requests', {
      token,
      body: { routeId, travelStartDate: '2026-12-10', travelEndDate: '2026-12-12' },
    });
    const secondId = second.json.data.request.id;
    const submitted = await api('POST', `/api/v1/travel-requests/${secondId}/submit`, {
      token,
    });
    assert.strictEqual(submitted.status, 200);

    const resubmit = await api('POST', `/api/v1/travel-requests/${secondId}/submit`, {
      token,
    });
    assert.strictEqual(resubmit.status, 400);
  });

  test('inline-route creation persists route + request atomically', async () => {
    const { token } = await registerTraveller();

    const created = await api('POST', '/api/v1/travel-requests', {
      token,
      body: {
        route: { stops: stops() },
        travelStartDate: '2026-10-01',
        travelEndDate: '2026-10-03',
        numberOfTravellers: 1,
      },
    });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.json.data.request.status, 'draft');
    assert.ok(created.json.data.request.routeId);
    assert.ok(created.json.data.request.route);
    assert.strictEqual(created.json.data.request.route.stops.length, 3);

    void models;
  });
});
