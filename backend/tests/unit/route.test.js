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
import { findOwnedRoute, calculateRouteForTraveller } from '../../src/modules/routes/routes.service.js';
import { MapService } from '../../src/integrations/maps/map.service.js';
import {
  GoogleRoutesMapProvider,
  decodeEncodedPolyline,
  parseDurationSeconds,
} from '../../src/integrations/maps/google-routes.provider.js';
import {
  getMapProvider,
  HaversineMapProvider,
  OsrmMapProvider,
} from '../../src/integrations/maps/map.provider.js';

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

describe('GoogleRoutesMapProvider unit tests', () => {
  test('decodeEncodedPolyline decodes Google encoded polyline correctly', () => {
    // Encoded polyline for points (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodeEncodedPolyline(encoded);
    assert.strictEqual(decoded.length, 3);
    assert.strictEqual(Math.round(decoded[0][0] * 10) / 10, 38.5);
    assert.strictEqual(Math.round(decoded[0][1] * 10) / 10, -120.2);
    assert.strictEqual(Math.round(decoded[1][0] * 10) / 10, 40.7);
    assert.strictEqual(Math.round(decoded[1][1] * 100) / 100, -120.95);
  });

  test('parseDurationSeconds converts seconds string to minutes', () => {
    assert.strictEqual(parseDurationSeconds('3600s'), 60);
    assert.strictEqual(parseDurationSeconds('90s'), 2);
    assert.strictEqual(parseDurationSeconds('0s'), 0);
    assert.strictEqual(parseDurationSeconds(null), 0);
  });

  test('throws NOT_CONFIGURED when GOOGLE_ROUTES_API_KEY is missing', async () => {
    const provider = new GoogleRoutesMapProvider({ apiKey: '' });
    await assert.rejects(
      provider.calculateRoute({ stops: [start(), final()] }),
      (err) => err.statusCode === 503 && /GOOGLE_ROUTES_API_KEY is not configured/i.test(err.message),
    );
  });

  test('throws 400 when intermediate stops exceed Google limit (25)', async () => {
    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-key' });
    const stops = [start()];
    for (let i = 0; i < 26; i += 1) {
      stops.push(intermediate({ name: `Stop ${i}` }));
    }
    stops.push(final());
    await assert.rejects(
      provider.calculateRoute({ stops }),
      (err) => err.statusCode === 400 && /maximum of 25 intermediate stops/i.test(err.message),
    );
  });

  test('successfully computes route and normalizes Google Routes response', async () => {
    const mockRouteResponse = {
      routes: [
        {
          distanceMeters: 550000,
          duration: '21600s', // 6 hours = 360 mins
          polyline: {
            encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          },
          legs: [
            {
              distanceMeters: 250000,
              duration: '9000s',
            },
            {
              distanceMeters: 300000,
              duration: '12600s',
            },
          ],
        },
      ],
    };

    let capturedUrl = null;
    let capturedHeaders = null;
    let capturedBody = null;

    const mockFetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => mockRouteResponse,
      };
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-api-key', fetchFn: mockFetch });
    const result = await provider.calculateRoute({ stops: [start(), intermediate(), final()] });

    assert.strictEqual(capturedUrl, 'https://routes.googleapis.com/directions/v2:computeRoutes');
    assert.strictEqual(capturedHeaders['X-Goog-Api-Key'], 'test-api-key');
    assert.ok(capturedHeaders['X-Goog-FieldMask'].includes('routes.duration'));
    assert.strictEqual(capturedBody.travelMode, 'DRIVE');
    assert.strictEqual(capturedBody.origin.location.latLng.latitude, 41.0082);
    assert.strictEqual(capturedBody.intermediates.length, 1);
    assert.strictEqual(capturedBody.destination.location.latLng.latitude, 39.9334);

    assert.strictEqual(result.provider, 'google');
    assert.strictEqual(result.distanceKm, 550);
    assert.strictEqual(result.durationMinutes, 360);
    assert.strictEqual(result.geometry.type, 'LineString');
    assert.strictEqual(result.geometry.coordinates.length, 3);
    assert.strictEqual(result.legs.length, 2);
    assert.strictEqual(result.legs[0].distanceKm, 250);
    assert.strictEqual(result.legs[0].durationMinutes, 150);
    assert.strictEqual(result.legs[0].startStopName, 'Istanbul');
    assert.strictEqual(result.legs[0].endStopName, 'Bolu');
  });

  test('handles Google API 403 / SERVICE_DISABLED gracefully with clear diagnostics', async () => {
    const mockDisabledResponse = {
      error: {
        code: 403,
        message: 'Routes API has not been used in project 996229920703 before or it is disabled.',
        status: 'PERMISSION_DENIED',
      },
    };

    const mockFetch = async () => ({
      ok: false,
      status: 403,
      json: async () => mockDisabledResponse,
    });

    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-key', fetchFn: mockFetch });
    await assert.rejects(
      provider.calculateRoute({ stops: [start(), final()] }),
      (err) => err.statusCode === 503 && /Google Routes API is not enabled/i.test(err.message),
    );
  });

  test('throws 422 when Google returns no routes', async () => {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ routes: [] }),
    });

    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-key', fetchFn: mockFetch });
    await assert.rejects(
      provider.calculateRoute({ stops: [start(), final()] }),
      (err) => err.statusCode === 422 && /No driving route could be found/i.test(err.message),
    );
  });

  test('regression: Delhi-to-Chandigarh driving request builds mutually exclusive waypoints without placeId collision', async () => {
    const delhi = {
      name: 'Delhi',
      latitude: 28.68146,
      longitude: 77.22279,
      type: 'start',
      placeId: 'ChIJL_P_CXMEDTkRw0ZdG-0GVvw',
    };
    const chandigarh = {
      name: 'Chandigarh',
      latitude: 30.73331,
      longitude: 76.77942,
      type: 'final',
      placeId: 'ChIJa8lu5gvtDzkR_hlzUvln_6U',
    };

    let sentBody = null;
    let sentHeaders = null;

    const mockFetch = async (url, options) => {
      sentBody = JSON.parse(options.body);
      sentHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          routes: [
            {
              distanceMeters: 248350,
              duration: '15600s',
              polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' },
              legs: [
                {
                  distanceMeters: 248350,
                  duration: '15600s',
                },
              ],
            },
          ],
        }),
      };
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key', fetchFn: mockFetch });
    const result = await provider.calculateRoute({ stops: [delhi, chandigarh], travelMode: 'DRIVE' });

    // Origin: must have location.latLng and MUST NOT have placeId in the same object
    assert.deepStrictEqual(sentBody.origin, {
      location: {
        latLng: {
          latitude: 28.68146,
          longitude: 77.22279,
        },
      },
    });
    assert.strictEqual(sentBody.origin.placeId, undefined);

    // Destination: must have location.latLng and MUST NOT have placeId
    assert.deepStrictEqual(sentBody.destination, {
      location: {
        latLng: {
          latitude: 30.73331,
          longitude: 76.77942,
        },
      },
    });
    assert.strictEqual(sentBody.destination.placeId, undefined);

    // Travel mode and routing preferences
    assert.strictEqual(sentBody.travelMode, 'DRIVE');
    assert.strictEqual(sentBody.routingPreference, 'TRAFFIC_UNAWARE');
    assert.strictEqual(sentBody.units, 'METRIC');

    // Field mask header
    assert.strictEqual(
      sentHeaders['X-Goog-FieldMask'],
      'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.warnings',
    );

    // Normalized result
    assert.strictEqual(result.travelMode, 'DRIVE');
    assert.strictEqual(result.distanceKm, 248.35);
    assert.strictEqual(result.durationMinutes, 260); // 15600s / 60
    assert.strictEqual(result.encodedPolyline, '_p~iF~ps|U_ulLnnqC');
    assert.strictEqual(result.legs.length, 1);
    assert.strictEqual(result.legs[0].startStopName, 'Delhi');
    assert.strictEqual(result.legs[0].endStopName, 'Chandigarh');
  });

  test('waypoint mapping falls back to placeId if coordinates are absent', async () => {
    let sentBody = null;
    const mockFetch = async (url, options) => {
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ routes: [{ distanceMeters: 1000, duration: '60s' }] }),
      };
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key', fetchFn: mockFetch });
    await provider.calculateRoute({
      stops: [
        { name: 'Start', placeId: 'PID_START', type: 'start' },
        { name: 'End', placeId: 'PID_END', type: 'final' },
      ],
    });

    assert.deepStrictEqual(sentBody.origin, { placeId: 'PID_START' });
    assert.deepStrictEqual(sentBody.destination, { placeId: 'PID_END' });
  });

  test('travelMode option: WALK, BICYCLE, and TRANSIT do not include routingPreference', async () => {
    const modes = ['WALK', 'BICYCLE', 'TRANSIT'];

    for (const mode of modes) {
      let sentBody = null;
      const mockFetch = async (url, options) => {
        sentBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            routes: [{ distanceMeters: 10000, duration: '3600s', polyline: { encodedPolyline: 'abc' } }],
          }),
        };
      };

      const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key', fetchFn: mockFetch });
      const result = await provider.calculateRoute({
        stops: [start(), final()],
        travelMode: mode,
      });

      assert.strictEqual(sentBody.travelMode, mode);
      assert.strictEqual(
        sentBody.routingPreference,
        undefined,
        `routingPreference should NOT be set for ${mode}`,
      );
      assert.strictEqual(result.travelMode, mode);
    }
  });

  test('travelMode option: TWO_WHEELER includes routingPreference TRAFFIC_UNAWARE', async () => {
    let sentBody = null;
    const mockFetch = async (url, options) => {
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          routes: [{ distanceMeters: 50000, duration: '3600s', polyline: { encodedPolyline: 'def' } }],
        }),
      };
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key', fetchFn: mockFetch });
    const result = await provider.calculateRoute({
      stops: [start(), final()],
      travelMode: 'TWO_WHEELER',
    });

    assert.strictEqual(sentBody.travelMode, 'TWO_WHEELER');
    assert.strictEqual(sentBody.routingPreference, 'TRAFFIC_UNAWARE');
    assert.strictEqual(result.travelMode, 'TWO_WHEELER');
  });

  test('TRANSIT mode rejects intermediate stops with a client-safe 400 error', async () => {
    const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key' });
    await assert.rejects(
      provider.calculateRoute({
        stops: [start(), intermediate(), final()],
        travelMode: 'TRANSIT',
      }),
      (err) =>
        err.statusCode === 400 &&
        /Public transit routing supports direct origin-to-destination journeys only/i.test(err.message),
    );
  });

  test('AIR mode calculates great-circle haversine distance without calling Google Routes API', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      throw new Error('Google Routes API should NOT be called in AIR mode');
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key', fetchFn: mockFetch });
    const result = await provider.calculateRoute({
      stops: [
        { name: 'Delhi', latitude: 28.68146, longitude: 77.22279, type: 'start' },
        { name: 'Chandigarh', latitude: 30.73331, longitude: 76.77942, type: 'final' },
      ],
      travelMode: 'AIR',
    });

    assert.strictEqual(fetchCalled, false, 'External Google Routes API was not called');
    assert.strictEqual(result.travelMode, 'AIR');
    assert.strictEqual(result.isAir, true);
    assert.strictEqual(result.durationMinutes, null);
    assert.ok(result.distanceKm > 220 && result.distanceKm < 245, `Distance was ${result.distanceKm} km`);
    assert.strictEqual(result.legs.length, 1);
    assert.strictEqual(result.legs[0].durationMinutes, null);
    assert.ok(result.encodedPolyline.length > 0);
  });

  test('handles Google API 429 RESOURCE_EXHAUSTED with rate limit message', async () => {
    const mockQuotaResponse = {
      error: {
        code: 429,
        message: 'Quota exceeded for quota metric computeRoutes.',
        status: 'RESOURCE_EXHAUSTED',
      },
    };

    const mockFetch = async () => ({
      ok: false,
      status: 429,
      json: async () => mockQuotaResponse,
    });

    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-key', fetchFn: mockFetch });
    await assert.rejects(
      provider.calculateRoute({ stops: [start(), final()] }),
      (err) => err.statusCode === 429 && /rate limit or quota exceeded/i.test(err.message),
    );
  });

  test('handles network failure with 503 error', async () => {
    const mockFetch = async () => {
      throw new Error('getaddrinfo ENOTFOUND routes.googleapis.com');
    };

    const provider = new GoogleRoutesMapProvider({ apiKey: 'test-key', fetchFn: mockFetch });
    await assert.rejects(
      provider.calculateRoute({ stops: [start(), final()] }),
      (err) => err.statusCode === 503 && /network request failed/i.test(err.message),
    );
  });

  describe('Deterministic Map Provider Selection', () => {
    const originalEnv = { ...process.env };

    const restoreEnv = () => {
      for (const key of Object.keys(process.env)) {
        if (!(key in originalEnv)) {
          delete process.env[key];
        }
      }
      Object.assign(process.env, originalEnv);
    };

    test('1. Test mode selects Haversine when no test override is configured', () => {
      try {
        process.env.NODE_ENV = 'test';
        delete process.env.MAP_PROVIDER;
        delete process.env.MAP_TEST_PROVIDER;
        delete process.env.GOOGLE_ROUTES_API_KEY;

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'haversine');
        assert.ok(provider instanceof HaversineMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('2. Test mode selects Haversine even if MAP_PROVIDER=google', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.MAP_PROVIDER = 'google';
        delete process.env.MAP_TEST_PROVIDER;

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'haversine');
        assert.ok(provider instanceof HaversineMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('3. Test mode selects Haversine if MAP_PROVIDER=GOOGLE', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.MAP_PROVIDER = 'GOOGLE';
        delete process.env.MAP_TEST_PROVIDER;

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'haversine');
        assert.ok(provider instanceof HaversineMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('4. Test mode selects Haversine if MAP_PROVIDER=google_routes', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.MAP_PROVIDER = 'google_routes';
        delete process.env.MAP_TEST_PROVIDER;

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'haversine');
        assert.ok(provider instanceof HaversineMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('5. Test mode selects Haversine if GOOGLE_ROUTES_API_KEY is populated', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.GOOGLE_ROUTES_API_KEY = 'real_or_fake_secret_key';
        delete process.env.MAP_PROVIDER;
        delete process.env.MAP_TEST_PROVIDER;

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'haversine');
        assert.ok(provider instanceof HaversineMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('6. A supported MAP_TEST_PROVIDER override works intentionally', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.MAP_TEST_PROVIDER = 'osrm';
        process.env.MAP_OSRM_BASE_URL = 'http://127.0.0.1:5000';

        const provider = getMapProvider();
        assert.strictEqual(provider.name, 'osrm');
        assert.ok(provider instanceof OsrmMapProvider);

        process.env.MAP_TEST_PROVIDER = 'google';
        process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
        const googleProvider = getMapProvider();
        assert.strictEqual(googleProvider.name, 'google');
        assert.ok(googleProvider instanceof GoogleRoutesMapProvider);
      } finally {
        restoreEnv();
      }
    });

    test('7. Production/development provider selection remains compatible with existing behavior', () => {
      try {
        process.env.NODE_ENV = 'development';
        delete process.env.MAP_PROVIDER;
        delete process.env.GOOGLE_ROUTES_API_KEY;
        assert.strictEqual(getMapProvider().name, 'haversine');

        process.env.GOOGLE_ROUTES_API_KEY = 'dev-key';
        assert.strictEqual(getMapProvider().name, 'google');

        process.env.MAP_PROVIDER = 'osrm';
        assert.strictEqual(getMapProvider().name, 'osrm');

        process.env.NODE_ENV = 'production';
        process.env.MAP_PROVIDER = 'google';
        assert.strictEqual(getMapProvider().name, 'google');
      } finally {
        restoreEnv();
      }
    });

    test('8. Explicit provider arguments behave according to a clearly documented contract', () => {
      try {
        process.env.NODE_ENV = 'test';
        process.env.MAP_PROVIDER = 'google';
        process.env.MAP_TEST_PROVIDER = 'haversine';

        const explicitOsrm = getMapProvider('osrm');
        assert.strictEqual(explicitOsrm.name, 'osrm');

        const explicitHaversine = getMapProvider('haversine');
        assert.strictEqual(explicitHaversine.name, 'haversine');

        const explicitGoogle = getMapProvider('google');
        assert.strictEqual(explicitGoogle.name, 'google');
      } finally {
        restoreEnv();
      }
    });
  });

  describe('travel-mode forwarding and mode-specific route calculations', () => {
    const delhi = { name: 'Delhi', latitude: 28.6139, longitude: 77.209, type: 'start' };
    const dehradun = { name: 'Dehradun', latitude: 30.3165, longitude: 78.0322, type: 'final' };

    test('1. MapService.calculateRoute forwards travelMode to provider', async () => {
      let receivedMode = null;
      const fakeProvider = {
        name: 'mock',
        calculateRoute: async ({ stops, travelMode }) => {
          receivedMode = travelMode;
          return {
            distanceKm: 216.12,
            durationMinutes: 190,
            travelMode,
            geometry: { type: 'LineString', coordinates: [] },
          };
        },
      };

      const mapService = new MapService(fakeProvider);
      const result = await mapService.calculateRoute({
        stops: [delhi, dehradun],
        travelMode: 'WALK',
      });

      assert.strictEqual(receivedMode, 'WALK');
      assert.strictEqual(result.travelMode, 'WALK');
    });

    test('2. HaversineMapProvider calculates mode-specific durations (Walk > Bicycle > Drive)', async () => {
      const provider = new HaversineMapProvider();

      const driveRes = await provider.calculateRoute({
        stops: [delhi, dehradun],
        travelMode: 'DRIVE',
      });
      const walkRes = await provider.calculateRoute({
        stops: [delhi, dehradun],
        travelMode: 'WALK',
      });
      const bikeRes = await provider.calculateRoute({
        stops: [delhi, dehradun],
        travelMode: 'BICYCLE',
      });
      const motoRes = await provider.calculateRoute({
        stops: [delhi, dehradun],
        travelMode: 'TWO_WHEELER',
      });

      // Distances are consistent across ground modes
      assert.strictEqual(driveRes.distanceKm, walkRes.distanceKm);

      // Durations MUST reflect mode speeds: WALK (5km/h) > BICYCLE (15km/h) > TWO_WHEELER (45km/h) > DRIVE (60km/h)
      assert.ok(walkRes.durationMinutes > bikeRes.durationMinutes);
      assert.ok(bikeRes.durationMinutes > motoRes.durationMinutes);
      assert.ok(motoRes.durationMinutes > driveRes.durationMinutes);

      // Walking 200+ km should take ~40+ hours, not 3 hours!
      assert.ok(walkRes.durationMinutes >= 2400, `Expected walk duration >= 2400 mins, got ${walkRes.durationMinutes}`);
      assert.ok(driveRes.durationMinutes <= 300, `Expected drive duration <= 300 mins, got ${driveRes.durationMinutes}`);

      assert.strictEqual(driveRes.travelMode, 'DRIVE');
      assert.strictEqual(walkRes.travelMode, 'WALK');
      assert.strictEqual(bikeRes.travelMode, 'BICYCLE');
      assert.strictEqual(motoRes.travelMode, 'TWO_WHEELER');
    });

    test('3. calculateRouteForTraveller handles DRIVE vs WALK vs AIR correctly', async () => {
      const mockProvider = new HaversineMapProvider();

      // DRIVE
      const driveResult = await calculateRouteForTraveller(
        { stops: [delhi, dehradun], travelMode: 'DRIVE' },
        { provider: mockProvider },
      );
      assert.strictEqual(driveResult.travelMode, 'DRIVE');
      assert.ok(driveResult.durationMinutes > 0);

      // WALK
      const walkResult = await calculateRouteForTraveller(
        { stops: [delhi, dehradun], travelMode: 'WALK' },
        { provider: mockProvider },
      );
      assert.strictEqual(walkResult.travelMode, 'WALK');
      assert.strictEqual(walkResult.distanceKm, driveResult.distanceKm);
      // Walking duration is dramatically higher than driving duration
      assert.ok(walkResult.durationMinutes > driveResult.durationMinutes * 5);

      // AIR
      const airResult = await calculateRouteForTraveller(
        { stops: [delhi, dehradun], travelMode: 'AIR' },
        { provider: mockProvider },
      );
      assert.strictEqual(airResult.travelMode, 'AIR');
      assert.strictEqual(airResult.isAir, true);
      assert.strictEqual(airResult.durationMinutes, null);
      assert.strictEqual(airResult.calculationProvider, 'great-circle-air');
    });

    test('4. GoogleRoutesMapProvider maps supported travel modes properly', () => {
      const provider = new GoogleRoutesMapProvider({ apiKey: 'mock-key' });
      assert.strictEqual(provider.mapTravelMode('DRIVE'), 'DRIVE');
      assert.strictEqual(provider.mapTravelMode('WALK'), 'WALK');
      assert.strictEqual(provider.mapTravelMode('BICYCLE'), 'BICYCLE');
      assert.strictEqual(provider.mapTravelMode('TWO_WHEELER'), 'TWO_WHEELER');
      assert.strictEqual(provider.mapTravelMode('TRANSIT'), 'TRANSIT');
      assert.strictEqual(provider.mapTravelMode('unknown'), 'DRIVE');
    });
  });
});
