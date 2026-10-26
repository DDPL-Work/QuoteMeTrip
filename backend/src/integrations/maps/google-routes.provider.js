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

/**
 * Encodes an array of [latitude, longitude] pairs into a Google encoded polyline string.
 */
export function encodePolyline(points) {
  if (!Array.isArray(points) || points.length === 0) return '';
  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  function encodeValue(val) {
    let num = val < 0 ? ~(val << 1) : val << 1;
    let chunks = '';
    while (num >= 0x20) {
      chunks += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }
    chunks += String.fromCharCode(num + 63);
    return chunks;
  }

  for (const [lat, lng] of points) {
    const latE5 = Math.round(Number(lat) * 1e5);
    const lngE5 = Math.round(Number(lng) * 1e5);
    result += encodeValue(latE5 - prevLat);
    result += encodeValue(lngE5 - prevLng);
    prevLat = latE5;
    prevLng = lngE5;
  }
  return result;
}

/**
 * Sanitizes sensitive strings (e.g. API keys, secrets) from diagnostic logs.
 */
export function sanitizeDiagnosticMessage(message) {
  if (!message || typeof message !== 'string') return '';
  return message.replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
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
   * In Google Routes API computeRoutes, a Waypoint target is a oneof union:
   * exactly one of `location`, `placeId`, or `address` can be set.
   * Setting both `location` and `placeId` causes HTTP 400 INVALID_ARGUMENT.
   */
  #buildWaypoint(stop) {
    const hasLat =
      stop.latitude !== undefined &&
      stop.latitude !== null &&
      Number.isFinite(Number(stop.latitude));
    const hasLng =
      stop.longitude !== undefined &&
      stop.longitude !== null &&
      Number.isFinite(Number(stop.longitude));

    if (hasLat && hasLng) {
      return {
        location: {
          latLng: {
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
          },
        },
      };
    }

    if (stop.placeId) {
      return {
        placeId: String(stop.placeId),
      };
    }

    throw new AppError(`Stop "${stop.name || 'Unknown'}" must have valid coordinates or placeId.`, {
      statusCode: 400,
      code: MAP_ERROR_CODES.CALCULATION_FAILED,
    });
  }

  mapTravelMode(mode) {
    const normalized = String(mode || 'DRIVE').trim().toUpperCase();
    return ['DRIVE', 'WALK', 'BICYCLE', 'TWO_WHEELER', 'TRANSIT'].includes(normalized)
      ? normalized
      : 'DRIVE';
  }

  async calculateRoute({ stops, travelMode = 'DRIVE' } = {}) {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new AppError('At least two stops are required to calculate a route.', {
        statusCode: 400,
        code: MAP_ERROR_CODES.CALCULATION_FAILED,
      });
    }

    const normalizedMode = String(travelMode || 'DRIVE').trim().toUpperCase();

    // AIR mode is handled via great-circle calculations and never sent to Google Routes API
    if (normalizedMode === 'AIR') {
      const { calculateAirRoute } = await import('./air-route.service.js');
      return calculateAirRoute(stops);
    }

    const GOOGLE_MODES = ['DRIVE', 'WALK', 'BICYCLE', 'TWO_WHEELER', 'TRANSIT'];
    if (!GOOGLE_MODES.includes(normalizedMode)) {
      throw new AppError(`Travel mode "${travelMode}" is not supported by Google Routes API.`, {
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
    if (normalizedMode === 'TRANSIT' && intermediateStops.length > 0) {
      throw new AppError(
        'Public transit routing supports direct origin-to-destination journeys only. Please remove intermediate stops for public transit.',
        {
          statusCode: 400,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        },
      );
    }

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
      travelMode: normalizedMode,
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'METRIC',
    };

    // Google Routes API ONLY accepts routingPreference for DRIVE and TWO_WHEELER
    if (normalizedMode === 'DRIVE' || normalizedMode === 'TWO_WHEELER') {
      requestBody.routingPreference = 'TRAFFIC_UNAWARE';
      requestBody.routeModifiers = {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      };
    }

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
      const code = errObj.code || response.status;
      const rawMessage = errObj.message || 'Routes calculation request rejected.';
      const sanitizedMessage = sanitizeDiagnosticMessage(rawMessage);

      // Server-side logging without leaking secrets or API keys
      console.error(
        `[GoogleRoutesProvider] Google Routes API error: HTTP ${response.status} (code: ${code}, status: ${status}) - ${sanitizedMessage}`,
      );

      const msgLower = rawMessage.toLowerCase();

      if (
        response.status === 403 ||
        status === 'PERMISSION_DENIED' ||
        msgLower.includes('api has not been used') ||
        msgLower.includes('disabled') ||
        msgLower.includes('api key not valid')
      ) {
        if (msgLower.includes('disabled') || msgLower.includes('not been used')) {
          throw new AppError(
            'Google Routes API is not enabled in Google Cloud Console. Please ensure Routes API is enabled.',
            {
              statusCode: 503,
              code: MAP_ERROR_CODES.NOT_CONFIGURED,
            },
          );
        }
        if (msgLower.includes('billing')) {
          throw new AppError('Google Cloud billing is not enabled for the Routes API.', {
            statusCode: 503,
            code: MAP_ERROR_CODES.NOT_CONFIGURED,
          });
        }
        throw new AppError(
          'Google Routes API authentication or permission failed. Please verify GOOGLE_ROUTES_API_KEY credentials.',
          {
            statusCode: 503,
            code: MAP_ERROR_CODES.NOT_CONFIGURED,
          },
        );
      }

      if (response.status === 429 || status === 'RESOURCE_EXHAUSTED' || msgLower.includes('quota')) {
        throw new AppError('Google Routes API rate limit or quota exceeded. Please try again shortly.', {
          statusCode: 429,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        });
      }

      if (response.status === 400 || status === 'INVALID_ARGUMENT') {
        throw new AppError('Invalid route parameters provided for Google Routes API.', {
          statusCode: 400,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        });
      }

      if (response.status === 404 || status === 'NOT_FOUND') {
        throw new AppError('One or more destinations could not be found by Google Routes API.', {
          statusCode: 404,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        });
      }

      throw new AppError(
        `Google Routes API could not calculate a ${normalizedMode.toLowerCase()} route for these stops.`,
        {
          statusCode: 502,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        },
      );
    }

    const route = data?.routes?.[0];
    if (!route) {
      const modeText = normalizedMode === 'DRIVE' ? 'driving' : normalizedMode.toLowerCase();
      let regionalHint = '';
      if (normalizedMode === 'BICYCLE') {
        regionalHint = ' Bicycle directions may not be supported by Google Maps in this region. Please select Drive, Walk, or Air.';
      } else if (normalizedMode === 'TRANSIT') {
        regionalHint = ' Public transit schedules are not available for this route in Google Maps. Please select Drive or Walk.';
      } else if (normalizedMode === 'TWO_WHEELER') {
        regionalHint = ' Motorcycle / two-wheeler routing is not available for this route in this region.';
      }
      throw new AppError(
        `No ${modeText} route could be found between the selected destinations.${regionalHint}`,
        {
          statusCode: 422,
          code: MAP_ERROR_CODES.CALCULATION_FAILED,
        },
      );
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
      travelMode: normalizedMode,
      geometry,
      encodedPolyline,
      legs,
      stops,
      provider: this.name,
      warnings: route.warnings || [],
      rawResponse: {
        provider: this.name,
        travelMode: normalizedMode,
        distanceMeters,
        duration: route.duration,
        legsCount: legs.length,
        warnings: route.warnings || [],
        encodedPolyline,
      },
    };
  }
}
