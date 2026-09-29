/**
 * Route + travel-request unit tests (Phase 4).
 *
 * No database required: covers stop validation, the recommended-day
 * formula, request validation, the status-transition map, and the
 * ownership helper (via an injected registry stub — no DB queries).
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  validateLatitude,
  validateLongitude,
  validateRouteStops,
} from '../../src/modules/routes/routes.validation.js';
import {
  calculateRecommendedDays,
  RECOMMENDED_DAYS_VERSION,
  KM_PER_DAY,
  STOPS_PER_DAY,
  MIN_DAYS,
  MAX_DAYS,
} from '../../src/integrations/maps/recommended-days.service.js';
import {
  validateDayInput,
  validateDaysList,
  validateCreateRequestInput,
  validatePatchRequestInput,
} from '../../src/modules/travel-requests/travel-requests.validation.js';
import { TRAVEL_REQUEST_TRANSITIONS } from '../../src/db/models/TravelRequest.js';
import { findOwnedRoute } from '../../src/modules/routes/routes.service.js';

const start = (overrides = {}) => ({
  name: 'Istanbul',
  latitude: 41.0082,
  longitude: 28.9784,
  type: 'start',
  ...overrides,
});

const intermediate = (overrides = {}) => ({
  name: 'Bolu',
  latitude: 40.7333,
  longitude: 31.6,
  type: 'intermediate',
  ...overrides,
});

const final = (overrides = {}) => ({
  name: 'Ankara',
  latitude: 39.9334,
  longitude: 32.8597,
  type: 'final',
  ...overrides,
});

describe('route stop validation', () => {
  test('accepts a start → intermediate → final list', () => {
    const stops = validateRouteStops([start(), intermediate(), final()]);
    assert.strictEqual(stops.length, 3);
    assert.strictEqual(stops[0].type, 'start');
    assert.strictEqual(stops[2].type, 'final');
  });

  test('accepts the minimal two-point route', () => {
    const stops = validateRouteStops([start(), final()]);
    assert.strictEqual(stops.length, 2);
  });

  test('rejects fewer than two points', () => {
    assert.throws(() => validateRouteStops([]), /start and a final/);
    assert.throws(() => validateRouteStops([start()]), /start and a final/);
    assert.throws(() => validateRouteStops('nope'), /start and a final/);
  });

  test('first stop must be the single start', () => {
    assert.throws(
      () => validateRouteStops([intermediate({ type: 'intermediate' }), final()]),
      /first stop must be the single start/i,
    );
    assert.throws(
      () => validateRouteStops([start(), start({ name: 'Second start' }), final()]),
      /single start/,
    );
  });

  test('last stop must be the single final destination', () => {
    assert.throws(
      () => validateRouteStops([start(), intermediate()]),
      /last stop must be the single final/i,
    );
    assert.throws(
      () => validateRouteStops([start(), final(), intermediate({ name: 'Trailing' })]),
      /single final/,
    );
  });

  test('bad coordinates are rejected', () => {
    assert.throws(() => validateRouteStops([start({ latitude: 91 }), final()]), /Latitude/);
    assert.throws(() => validateRouteStops([start({ longitude: 200 }), final()]), /Longitude/);
    assert.throws(() => validateLatitude('not-a-number'), /Latitude/);
    assert.throws(() => validateLongitude(NaN), /Longitude/);
  });

  test('stop names are required', () => {
    assert.throws(() => validateRouteStops([start({ name: '  ' }), final()]), /requires a name/);
  });
});

describe('recommended-day calculation', () => {
  test('formula is ceil(distance/300) + ceil(intermediate/2)', () => {
    assert.strictEqual(KM_PER_DAY, 300);
    assert.strictEqual(STOPS_PER_DAY, 2);
    assert.strictEqual(RECOMMENDED_DAYS_VERSION, 'v1');

    // 450km -> 2 distance-days, 1 intermediate -> 1 stop-day = 3 total.
    assert.strictEqual(calculateRecommendedDays({ distanceKm: 450, intermediateStops: 1 }), 3);
    // Exact multiples: 600km -> 2, 4 intermediates -> 2, total 4.
    assert.strictEqual(calculateRecommendedDays({ distanceKm: 600, intermediateStops: 4 }), 4);
    // Zero/empty route still needs a single day.
    assert.strictEqual(calculateRecommendedDays({ distanceKm: 0, intermediateStops: 0 }), 1);
  });

  test('result is clamped to 1..30', () => {
    assert.strictEqual(MIN_DAYS, 1);
    assert.strictEqual(MAX_DAYS, 30);
    assert.strictEqual(
      calculateRecommendedDays({ distanceKm: 100000, intermediateStops: 100 }),
      30,
    );
    assert.strictEqual(calculateRecommendedDays({ distanceKm: -50, intermediateStops: -3 }), 1);
  });
});

describe('travel-request validation', () => {
  test('create requires routeId or an inline route', () => {
    assert.throws(() => validateCreateRequestInput({}), /routeId or an inline route/);
    const byId = validateCreateRequestInput({ routeId: 7 });
    assert.strictEqual(byId.routeId, 7);
    const inline = validateCreateRequestInput({
      route: { stops: [start(), final()] },
    });
    assert.strictEqual(inline.inlineRoute.stops.length, 2);
  });

  test('travel dates must be valid and ordered', () => {
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, travelStartDate: 'not-a-date' }),
      /YYYY-MM-DD/,
    );
    assert.throws(
      () =>
        validateCreateRequestInput({
          routeId: 1,
          travelStartDate: '2026-10-05',
          travelEndDate: '2026-10-01',
        }),
      /before the start date/,
    );
    const ok = validateCreateRequestInput({
      routeId: 1,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-05',
    });
    assert.strictEqual(ok.travelStartDate, '2026-10-01');
    assert.strictEqual(ok.travelEndDate, '2026-10-05');
  });

  test('counts and enums are enforced', () => {
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, numberOfTravellers: 0 }),
      /Number of travellers/,
    );
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, luggageCount: -1 }),
      /Luggage count/,
    );
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, accommodationType: 'tent' }),
      /Accommodation type/,
    );
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, packageType: 'everything' }),
      /Package type/,
    );
    assert.throws(
      () => validateCreateRequestInput({ routeId: 1, hotelRequired: 'yes' }),
      /must be a boolean/,
    );
    const ok = validateCreateRequestInput({
      routeId: 1,
      numberOfTravellers: 2,
      luggageCount: 3,
      accommodationType: '4_star',
      packageType: 'full_package',
      hotelRequired: true,
    });
    assert.strictEqual(ok.numberOfTravellers, 2);
    assert.strictEqual(ok.accommodationType, '4_star');
  });

  test('day numbers must be unique and dates ordered', () => {
    assert.throws(
      () =>
        validateDaysList([
          { dayNumber: 1, date: '2026-10-01' },
          { dayNumber: 1, date: '2026-10-02' },
        ]),
      /unique/,
    );
    assert.throws(
      () =>
        validateDaysList([
          { dayNumber: 1, date: '2026-10-05' },
          { dayNumber: 2, date: '2026-10-01' },
        ]),
      /ordered by day number/,
    );
    const ok = validateDaysList([
      { dayNumber: 1, date: '2026-10-01', location: 'Istanbul' },
      { dayNumber: 2, date: '2026-10-02', location: 'Ankara' },
    ]);
    assert.strictEqual(ok.length, 2);
  });

  test('day input requires a dayNumber in range', () => {
    assert.throws(() => validateDayInput({}), /dayNumber/);
    assert.throws(() => validateDayInput({ dayNumber: 0 }), /dayNumber/);
    assert.throws(() => validateDayInput({ dayNumber: 366 }), /dayNumber/);
  });

  test('patch input forbids changing the route', () => {
    assert.throws(() => validatePatchRequestInput({ routeId: 2 }), /cannot be changed/);
    assert.throws(
      () => validatePatchRequestInput({ route: { stops: [start(), final()] } }),
      /cannot be changed/,
    );
    const ok = validatePatchRequestInput({ numberOfTravellers: 3 });
    assert.strictEqual(ok.numberOfTravellers, 3);
    assert.strictEqual(ok.routeId, undefined);
  });
});

describe('travel-request status transitions', () => {
  test('draft → submitted/cancelled, submitted → cancelled/accepted (Phase 6)', () => {
    assert.deepStrictEqual([...TRAVEL_REQUEST_TRANSITIONS.draft].sort(), [
      'cancelled',
      'submitted',
    ]);
    assert.deepStrictEqual([...TRAVEL_REQUEST_TRANSITIONS.submitted].sort(), [
      'accepted',
      'cancelled',
    ]);
  });

  test('terminal and future states have no Phase 4 transitions', () => {
    for (const state of ['matching', 'quoted', 'accepted', 'cancelled', 'completed']) {
      assert.deepStrictEqual(
        TRAVEL_REQUEST_TRANSITIONS[state],
        [],
        `${state} should have no transitions`,
      );
    }
  });
});

describe('route ownership helper', () => {
  function stubRegistry(routeRow) {
    return {
      Route: {
        findByPk: async () => routeRow,
      },
      RouteStop: {},
    };
  }

  test('findOwnedRoute returns the owned route with sorted stops', async () => {
    const row = {
      id: 11,
      travellerId: 5,
      stops: [
        { sequence: 2, locationName: 'C' },
        { sequence: 0, locationName: 'A' },
        { sequence: 1, locationName: 'B' },
      ],
    };
    const route = await findOwnedRoute(11, 5, { registry: stubRegistry(row) });
    assert.strictEqual(route.id, 11);
    assert.deepStrictEqual(
      route.stops.map((s) => s.locationName),
      ['A', 'B', 'C'],
    );
  });

  test('findOwnedRoute throws NotFound for missing routes', async () => {
    await assert.rejects(
      findOwnedRoute(999, 5, { registry: stubRegistry(null) }),
      (err) => err.name === 'NotFoundError' && err.statusCode === 404,
    );
  });

  test('findOwnedRoute throws NotFound for cross-owner lookups (no existence leak)', async () => {
    const row = { id: 11, travellerId: 5, stops: [] };
    await assert.rejects(
      findOwnedRoute(11, 6, { registry: stubRegistry(row) }),
      (err) =>
        err.name === 'NotFoundError' && err.statusCode === 404 && /not found/i.test(err.message),
    );
  });
});
