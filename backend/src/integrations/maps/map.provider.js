/**
 * Map provider abstraction (Phase 4).
 *
 * Business logic depends ONLY on this interface — never on a concrete
 * map SDK. Concrete providers (haversine fallback, OSRM, Google, …)
 * implement `calculateRoute({ stops })` and return the normalized
 * shape below. The factory `getMapProvider()` selects the provider
 * from `MAP_PROVIDER` without crashing unrelated modules when
 * external credentials are missing.
 *
 * Normalized result:
 * {
 *   distanceKm, durationMinutes, geometry, stops, provider, rawResponse
 * }
 */
import { AppError } from '../../utils/errors.js';

export const MAP_ERROR_CODES = {
  NOT_CONFIGURED: 'MAP_PROVIDER_NOT_CONFIGURED',
  CALCULATION_FAILED: 'MAP_CALCULATION_FAILED',
};

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 60;

function toRadians(degrees) {
  return (Number(degrees) * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export class MapProvider {
  get name() {
    return 'base';
  }

  // eslint-disable-next-line no-unused-vars
  async calculateRoute({ stops } = {}) {
    throw new Error('MapProvider.calculateRoute() is not implemented.');
  }

  // Backwards-compatible alias used by early placeholders.
  async getRoute(input) {
    return this.calculateRoute(input);
  }
}

/**
 * Credential-free great-circle fallback. Works without any external
 * key so route planning and tests never depend on a vendor. Distance
 * is the summed haversine legs; duration assumes AVERAGE_SPEED_KMH;
 * geometry is the stop polyline.
 */
export class HaversineMapProvider extends MapProvider {
  get name() {
    return 'haversine';
  }

  async calculateRoute({ stops } = {}) {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new AppError('At least two stops are required to calculate a route.', {
        statusCode: 400,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }
    let distanceKm = 0;
    for (let i = 1; i < stops.length; i += 1) {
      distanceKm += haversineKm(stops[i - 1], stops[i]);
    }
    const durationMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
    const geometry = {
      type: 'LineString',
      coordinates: stops.map((s) => [Number(s.longitude), Number(s.latitude)]),
    };
    const rounded = Math.round(distanceKm * 100) / 100;
    return {
      distanceKm: rounded,
      durationMinutes,
      geometry,
      stops,
      provider: this.name,
      rawResponse: {
        provider: this.name,
        legs: stops.length - 1,
        averageSpeedKmh: AVERAGE_SPEED_KMH,
      },
    };
  }
}

/**
 * OSRM adapter (optional). Requires MAP_OSRM_BASE_URL when selected.
 * Falls back to a clear configuration error — never crashes
 * unrelated modules at import time.
 */
export class OsrmMapProvider extends MapProvider {
  constructor({ baseUrl } = {}) {
    super();
    this.baseUrl = baseUrl || process.env.MAP_OSRM_BASE_URL || '';
  }

  get name() {
    return 'osrm';
  }

  async calculateRoute({ stops } = {}) {
    if (!this.baseUrl) {
      throw new AppError('Map provider "osrm" requires MAP_OSRM_BASE_URL to be configured.', {
        statusCode: 503,
        code: MAP_ERROR_CODES.NOT_CONFIGURED,
      });
    }
    const coords = stops.map((s) => `${s.longitude},${s.latitude}`).join(';');
    const url = `${this.baseUrl.replace(/\/$/, '')}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    let response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new AppError(`Map provider request failed: ${err.message}`, {
        statusCode: 503,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }
    if (!response.ok) {
      throw new AppError('Map provider could not calculate the route.', {
        statusCode: 503,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }
    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route) {
      throw new AppError('Map provider returned no route.', {
        statusCode: 503,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }
    return {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry || null,
      stops,
      provider: this.name,
      rawResponse: data,
    };
  }
}

/**
 * Provider factory. `MAP_PROVIDER` selects the adapter:
 *   haversine (default, no credentials) | osrm | google | mapbox
 * google/mapbox have no adapter in Phase 4 — selecting them returns
 * a clear configuration error at call time (not import time) so the
 * rest of the app keeps working.
 */
export function getMapProvider(name = process.env.MAP_PROVIDER || 'haversine') {
  const selected = String(name || 'haversine').toLowerCase();
  if (selected === 'haversine' || selected === '') {
    return new HaversineMapProvider();
  }
  if (selected === 'osrm') {
    return new OsrmMapProvider();
  }
  if (selected === 'mock') {
    return new HaversineMapProvider();
  }
  const err = new AppError(
    `Map provider "${selected}" is not configured. Set MAP_PROVIDER=haversine (no credentials) or configure the selected provider.`,
    { statusCode: 503, code: MAP_ERROR_CODES.NOT_CONFIGURED },
  );
  return {
    get name() {
      return selected;
    },
    async calculateRoute() {
      throw err;
    },
    async getRoute() {
      throw err;
    },
  };
}
