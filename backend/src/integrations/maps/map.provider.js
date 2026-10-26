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
import { MapProvider, MAP_ERROR_CODES, haversineKm } from './base.provider.js';
import { GoogleRoutesMapProvider } from './google-routes.provider.js';

export { MapProvider, MAP_ERROR_CODES, haversineKm };

const AVERAGE_SPEED_KMH = 60;

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

  async calculateRoute({ stops, travelMode = 'DRIVE' } = {}) {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new AppError('At least two stops are required to calculate a route.', {
        statusCode: 400,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    const normalizedMode = String(travelMode || 'DRIVE').trim().toUpperCase();

    if (normalizedMode === 'AIR') {
      const { calculateAirRoute } = await import('./air-route.service.js');
      return calculateAirRoute(stops);
    }

    const MODE_SPEEDS_KMH = {
      DRIVE: 60,
      TWO_WHEELER: 45,
      BICYCLE: 15,
      WALK: 5,
      TRANSIT: 30,
    };
    const speedKmh = MODE_SPEEDS_KMH[normalizedMode] || 60;

    let distanceKm = 0;
    const legs = [];

    for (let i = 1; i < stops.length; i += 1) {
      const legDist = haversineKm(stops[i - 1], stops[i]);
      distanceKm += legDist;
      const legDuration = Math.round((legDist / speedKmh) * 60);
      legs.push({
        index: i - 1,
        startStopName: stops[i - 1]?.name || `Stop ${i}`,
        endStopName: stops[i]?.name || `Stop ${i + 1}`,
        distanceKm: Math.round(legDist * 100) / 100,
        durationMinutes: legDuration,
      });
    }

    const { encodePolyline } = await import('./google-routes.provider.js');
    const encodedPolyline = encodePolyline(
      stops.map((s) => [Number(s.latitude), Number(s.longitude)]),
    );

    const durationMinutes = Math.round((distanceKm / speedKmh) * 60);
    const geometry = {
      type: 'LineString',
      coordinates: stops.map((s) => [Number(s.longitude), Number(s.latitude)]),
      encodedPolyline,
    };
    const rounded = Math.round(distanceKm * 100) / 100;
    return {
      distanceKm: rounded,
      durationMinutes,
      travelMode: normalizedMode,
      geometry,
      encodedPolyline,
      legs,
      stops,
      provider: this.name,
      warnings: [],
      rawResponse: {
        provider: this.name,
        travelMode: normalizedMode,
        legs: stops.length - 1,
        averageSpeedKmh: speedKmh,
        encodedPolyline,
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
 *   google | haversine (credential-free great-circle fallback) | osrm
 */
export function getMapProvider(name = null) {
  let resolved = name;
  if (!resolved) {
    if (process.env.NODE_ENV === 'test') {
      if (process.env.MAP_TEST_PROVIDER) {
        resolved = process.env.MAP_TEST_PROVIDER;
      } else {
        const envProv = (process.env.MAP_PROVIDER || '').trim().toLowerCase();
        if (envProv && envProv !== 'google' && envProv !== 'google_routes') {
          resolved = envProv;
        } else {
          resolved = 'haversine';
        }
      }
    } else {
      resolved = process.env.MAP_PROVIDER || (process.env.GOOGLE_ROUTES_API_KEY ? 'google' : 'haversine');
    }
  }

  const selected = String(resolved || 'haversine').trim().toLowerCase();
  if (selected === 'google' || selected === 'google_routes') {
    return new GoogleRoutesMapProvider({ apiKey: process.env.GOOGLE_ROUTES_API_KEY });
  }
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
    `Map provider "${selected}" is not configured. Set MAP_PROVIDER=google (with GOOGLE_ROUTES_API_KEY) or MAP_PROVIDER=haversine (no credentials).`,
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
