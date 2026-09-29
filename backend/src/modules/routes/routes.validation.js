/**
 * Route validation (Phase 4 — backend-authoritative).
 */
import { ValidationError } from '../../utils/errors.js';
import { ROUTE_STOP_TYPES } from '../../db/models/RouteStop.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: 'ROUTE_VALIDATION_ERROR', details });
}

export function validateLatitude(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < -90 || num > 90) {
    throw invalid('Latitude must be a number between -90 and 90.');
  }
  return num;
}

export function validateLongitude(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < -180 || num > 180) {
    throw invalid('Longitude must be a number between -180 and 180.');
  }
  return num;
}

function validateStop(input, index) {
  if (!input || typeof input !== 'object') {
    throw invalid(`Stop at index ${index} must be an object.`);
  }
  const name = String(input.name ?? input.locationName ?? '').trim();
  if (!name || name.length > 190) {
    throw invalid(`Stop at index ${index} requires a name (max 190 chars).`);
  }
  const latitude = validateLatitude(input.latitude);
  const longitude = validateLongitude(input.longitude);
  let type = String(input.type ?? input.stopType ?? 'intermediate').toLowerCase();
  if (!ROUTE_STOP_TYPES.includes(type)) {
    throw invalid(
      `Stop "${name}" has invalid type. Must be one of: ${ROUTE_STOP_TYPES.join(', ')}.`,
    );
  }
  const placeId =
    input.placeId === undefined || input.placeId === null || input.placeId === ''
      ? null
      : String(input.placeId).slice(0, 190);
  return { name, latitude, longitude, type, placeId };
}

/**
 * Validate an ordered stop list: minimum 2 points, exactly one
 * start (first) and one final (last), explicit sequence = array
 * order. Intermediate stops are optional.
 */
export function validateRouteStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw invalid('A route requires at least a start and a final destination.');
  }
  if (stops.length > 50) {
    throw invalid('A route supports at most 50 stops.');
  }
  const normalized = stops.map((s, i) => validateStop(s, i));

  const starts = normalized.filter((s) => s.type === 'start');
  const finals = normalized.filter((s) => s.type === 'final');
  if (starts.length !== 1 || normalized[0].type !== 'start') {
    throw invalid('The first stop must be the single start of the route.');
  }
  if (finals.length !== 1 || normalized[normalized.length - 1].type !== 'final') {
    throw invalid('The last stop must be the single final destination of the route.');
  }
  return normalized;
}

export function validateCalculateRouteInput(body = {}) {
  return { stops: validateRouteStops(body.stops) };
}

export function validateSaveRouteInput(body = {}) {
  const stops = body.stops !== undefined ? validateRouteStops(body.stops) : null;
  const output = { stops };
  if (body.startLocation !== undefined) {
    const v = String(body.startLocation).trim();
    if (!v || v.length > 190) throw invalid('startLocation must be 1–190 characters.');
    output.startLocation = v;
  }
  if (body.finalDestination !== undefined) {
    const v = String(body.finalDestination).trim();
    if (!v || v.length > 190) throw invalid('finalDestination must be 1–190 characters.');
    output.finalDestination = v;
  }
  if (body.totalDistanceKm !== undefined) {
    const n = Number(body.totalDistanceKm);
    if (!Number.isFinite(n) || n < 0 || n > 100000)
      throw invalid('totalDistanceKm must be 0–100000.');
    output.totalDistanceKm = Math.round(n * 100) / 100;
  }
  if (body.estimatedDurationMinutes !== undefined) {
    const n = Number(body.estimatedDurationMinutes);
    if (!Number.isInteger(n) || n < 0 || n > 1000000) {
      throw invalid('estimatedDurationMinutes must be a non-negative integer.');
    }
    output.estimatedDurationMinutes = n;
  }
  if (body.recommendedDays !== undefined) {
    const n = Number(body.recommendedDays);
    if (!Number.isInteger(n) || n < 1 || n > 30) throw invalid('recommendedDays must be 1–30.');
    output.recommendedDays = n;
  }
  return output;
}
