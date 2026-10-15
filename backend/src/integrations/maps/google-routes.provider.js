/**
 * Google Routes API provider (Google Maps Platform Routes API v2).
 *
 * Implements `calculateRoute({ stops })` using the Google Routes API:
 *   POST https://routes.googleapis.com/directions/v2:computeRoutes
 *
 * Requirements:
 * - Uses GOOGLE_ROUTES_API_KEY from environment (never hardcoded, never exposed).
 * - Origin: first stop.
 * - Destination: last stop.
 * - Intermediates: intermediate stops in selected order.
 * - Field mask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.warnings
 * - Driving mode for road trip planning.
 * - Returns normalized shape:
 *   { distanceKm, durationMinutes, geometry, encodedPolyline, legs, stops, provider, rawResponse, warnings }
 * - Never returns fabricated distances or fake curves as Google results.
 */
import { MapProvider, MAP_ERROR_CODES } from './base.provider.js';
import { AppError } from '../../utils/errors.js';

const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const MAX_GOOGLE_INTERMEDIATES = 25; // Google Routes API intermediate waypoint limit

/**
 * Decodes a Google encoded polyline string into an array of [latitude, longitude] pairs.
 * Standard polyline lossy compression decoding algorithm.
 */
export function decodeEncodedPolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // Google polyline coordinates are scaled by 1e5
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/**
 * Converts decoded [lat, lng] points to GeoJSON LineString coordinates: [longitude, latitude].
 */
export function polylineToGeoJsonCoordinates(points) {
  return points.map(([lat, lng]) => [
    Math.round(lng * 1e6) / 1e6,
    Math.round(lat * 1e6) / 1e6,
  ]);
}

/**
 * Parses Google duration string (e.g. "1234s") into integer minutes.
 */
export function parseDurationSeconds(durationStr) {
  if (!durationStr) return 0;
  const seconds = parseInt(String(durationStr).replace(/s$/i, ''), 10);
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.round(seconds / 60);
}

export class GoogleRoutesMapProvider extends MapProvider {
  constructor({ apiKey = null, fetchFn = null } = {}) {
    super();
    this.apiKey = apiKey !== null && apiKey !== undefined ? apiKey : (process.env.GOOGLE_ROUTES_API_KEY || '');
    this.fetch = fetchFn || globalThis.fetch;
  }

  get name() {
    return 'google';
  }

  /**
   * Builds Google Routes API Waypoint representation for a stop.
   */
  #buildWaypoint(stop) {
    const wp = {
      location: {
        latLng: {
          latitude: Number(stop.latitude),
          longitude: Number(stop.longitude),
        },
      },
    };
    if (stop.placeId) {
      wp.placeId = String(stop.placeId);
    }
    return wp;
  }

  async calculateRoute({ stops } = {}) {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new AppError('At least two stops are required to calculate a route.', {
        statusCode: 400,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    if (!this.apiKey) {
      throw new AppError(
        'Google Routes API provider is selected but GOOGLE_ROUTES_API_KEY is not configured in the environment. Set GOOGLE_ROUTES_API_KEY in your server environment.',
        {
          statusCode: 503,
          code: MAP_ERROR_CODES.NOT_CONFIGURED,
        },
      );
    }

    const intermediateStops = stops.slice(1, -1);
    if (intermediateStops.length > MAX_GOOGLE_INTERMEDIATES) {
      throw new AppError(
        `Google Routes API supports a maximum of ${MAX_GOOGLE_INTERMEDIATES} intermediate stops (received ${intermediateStops.length}).`,
        {
          statusCode: 400,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        },
      );
    }

    const origin = this.#buildWaypoint(stops[0]);
    const destination = this.#buildWaypoint(stops[stops.length - 1]);
    const intermediates = intermediateStops.map((s) => this.#buildWaypoint(s));

    const requestBody = {
      origin,
      destination,
      intermediates,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: 'en-US',
      units: 'METRIC',
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.warnings',
    };

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        response = await this.fetch(GOOGLE_ROUTES_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AppError('Google Routes API request timed out after 15 seconds.', {
          statusCode: 504,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        });
      }
      throw new AppError(`Google Routes API network request failed: ${err.message}`, {
        statusCode: 503,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new AppError('Google Routes API returned an invalid response format.', {
        statusCode: 502,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    if (!response.ok || data?.error) {
      const errObj = data?.error || {};
      const status = errObj.status || response.status;
      const message = errObj.message || 'Routes calculation request rejected.';

      // Server-side logging without leaking the secret key
      console.error(
        `[GoogleRoutesProvider] Google Routes API error: HTTP ${response.status} (${status}) - ${message}`,
      );

      if (
        response.status === 403 ||
        status === 'PERMISSION_DENIED' ||
        message.includes('API has not been used') ||
        message.includes('disabled')
      ) {
        throw new AppError(
          'Google Routes API is not enabled or credentials are misconfigured. Please verify GOOGLE_ROUTES_API_KEY and ensure Routes API is enabled in Google Cloud Console.',
          {
            statusCode: 503,
            code: MAP_ERROR_CODES.NOT_CONFIGURED,
          },
        );
      }

      if (response.status === 400 || status === 'INVALID_ARGUMENT') {
        throw new AppError('Invalid route parameters provided for Google Routes API.', {
          statusCode: 400,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        });
      }

      throw new AppError('Google Routes API could not calculate a road route for these stops.', {
        statusCode: 502,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    const route = data?.routes?.[0];
    if (!route) {
      throw new AppError('No driving route could be found between the selected destinations.', {
        statusCode: 422,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    const distanceMeters = Number(route.distanceMeters || 0);
    const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
    const durationMinutes = parseDurationSeconds(route.duration);
    const encodedPolyline = route.polyline?.encodedPolyline || null;

    // Decode polyline into GeoJSON LineString coordinates
    const decodedPoints = encodedPolyline ? decodeEncodedPolyline(encodedPolyline) : [];
    const coordinates =
      decodedPoints.length > 0
        ? polylineToGeoJsonCoordinates(decodedPoints)
        : stops.map((s) => [Number(s.longitude), Number(s.latitude)]);

    const geometry = {
      type: 'LineString',
      coordinates,
      encodedPolyline,
    };

    // Format individual route legs
    const legs = (route.legs || []).map((leg, index) => {
      const legDistanceMeters = Number(leg.distanceMeters || 0);
      const legDistanceKm = Math.round((legDistanceMeters / 1000) * 100) / 100;
      const legDurationMinutes = parseDurationSeconds(leg.duration);
      return {
        index,
        startStopName: stops[index]?.name || `Stop ${index + 1}`,
        endStopName: stops[index + 1]?.name || `Stop ${index + 2}`,
        distanceKm: legDistanceKm,
        durationMinutes: legDurationMinutes,
      };
    });

    return {
      distanceKm,
      durationMinutes,
      geometry,
      encodedPolyline,
      legs,
      stops,
      provider: this.name,
      warnings: route.warnings || [],
      rawResponse: {
        provider: this.name,
        distanceMeters,
        duration: route.duration,
        legsCount: legs.length,
        warnings: route.warnings || [],
        encodedPolyline,
      },
    };
  }
}
