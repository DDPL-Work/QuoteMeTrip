/**
 * Travel-request validation (Phase 4 — backend-authoritative).
 */
import { ValidationError } from '../../utils/errors.js';
import {
  ACCOMMODATION_TYPES,
  PACKAGE_TYPES,
  CRUISE_DURATIONS,
} from '../../db/models/TravelRequest.js';
import { validateRouteStops } from '../routes/routes.validation.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: 'TRAVEL_REQUEST_VALIDATION_ERROR', details });
}

function optionalText(value, { max, field }) {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  if (text.length > max) throw invalid(`${field} must be at most ${max} characters.`);
  return text;
}

function validateDateOnly(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw invalid(`${field} must be a valid YYYY-MM-DD date.`);
  }
  return text;
}

function validatePositiveInt(value, { field, min, max }) {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw invalid(`${field} must be an integer between ${min} and ${max}.`);
  }
  return n;
}

function toBoolean(value, field) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  throw invalid(`${field} must be a boolean.`);
}

export function validateDayInput(day, index = 0) {
  if (!day || typeof day !== 'object') throw invalid(`Day at index ${index} must be an object.`);
  const dayNumber = Number(day.dayNumber ?? day.day_number);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 365) {
    throw invalid(`Day at index ${index} requires dayNumber 1–365.`);
  }
  const date =
    day.date === undefined || day.date === null || day.date === ''
      ? null
      : validateDateOnly(day.date, `Day ${dayNumber} date`);
  const pick = (camel, snake, max) => {
    const raw = day[camel] ?? day[snake];
    if (raw === undefined || raw === null) return null;
    const text = String(raw);
    if (text.length > max)
      throw invalid(`Day ${dayNumber} ${camel} must be at most ${max} characters.`);
    const trimmed = text.trim();
    return trimmed === '' ? null : trimmed;
  };
  return {
    dayNumber,
    date,
    location: pick('location', 'location', 190),
    title: pick('title', 'title', 190),
    description: pick('description', 'description', 5000),
    hotelNotes: pick('hotelNotes', 'hotel_notes', 2000),
    guideNotes: pick('guideNotes', 'guide_notes', 2000),
    driverNotes: pick('driverNotes', 'driver_notes', 2000),
    specialRequirements: pick('specialRequirements', 'special_requirements', 2000),
  };
}

export function validateDaysList(days) {
  if (days === undefined) return undefined;
  if (!Array.isArray(days)) throw invalid('Days must be an array.');
  if (days.length > 365) throw invalid('A request supports at most 365 days.');
  const normalized = days.map((d, i) => validateDayInput(d, i));
  const numbers = normalized.map((d) => d.dayNumber);
  if (new Set(numbers).size !== numbers.length) {
    throw invalid('Day numbers must be unique per request.');
  }
  const dated = normalized.filter((d) => d.date).sort((a, b) => a.dayNumber - b.dayNumber);
  for (let i = 1; i < dated.length; i += 1) {
    if (dated[i].date < dated[i - 1].date) {
      throw invalid('Day dates must be ordered by day number.');
    }
  }
  return normalized;
}

export function validateCreateRequestInput(body = {}) {
  if (!body || typeof body !== 'object') throw invalid('Request body must be an object.');
  const output = {};

  if (body.routeId !== undefined && body.routeId !== null) {
    const n = Number(body.routeId ?? body.route_id);
    if (!Number.isInteger(n) || n < 1) throw invalid('routeId must be a positive integer.');
    output.routeId = n;
  }
  if (body.route !== undefined) {
    if (typeof body.route !== 'object' || !Array.isArray(body.route.stops)) {
      throw invalid('Inline route must include a stops array.');
    }
    output.inlineRoute = { stops: validateRouteStops(body.route.stops) };
  }
  if (output.routeId === undefined && output.inlineRoute === undefined) {
    throw invalid('Either routeId or an inline route with stops is required.');
  }

  const durationRaw = body.chosenDuration ?? body.chosen_duration;
  let duration = undefined;
  if (durationRaw !== undefined && durationRaw !== null && durationRaw !== '') {
    duration = validatePositiveInt(durationRaw, { field: 'Chosen duration', min: 1, max: 365 });
  }

  const start = validateDateOnly(
    body.travelStartDate ?? body.travel_start_date,
    'Travel start date',
  );
  let end = validateDateOnly(body.travelEndDate ?? body.travel_end_date, 'Travel end date');

  // Enforce consistent date calculation: endDate = startDate + (duration - 1 days)
  if (start && duration) {
    const d = new Date(start);
    d.setDate(d.getDate() + (duration - 1));
    const calculatedEnd = d.toISOString().slice(0, 10);
    end = calculatedEnd;
    output.chosenDuration = duration;
  } else if (start && end) {
    const sTime = Date.parse(start);
    const eTime = Date.parse(end);
    if (eTime >= sTime) {
      output.chosenDuration = Math.round((eTime - sTime) / 86400000) + 1;
    }
  } else if (duration) {
    output.chosenDuration = duration;
  }

  if (start !== undefined) output.travelStartDate = start;
  if (end !== undefined) output.travelEndDate = end;
  if (
    output.travelStartDate &&
    output.travelEndDate &&
    output.travelEndDate < output.travelStartDate
  ) {
    throw invalid('Travel end date cannot be before the start date.');
  }

  const travellers = validatePositiveInt(body.numberOfTravellers ?? body.number_of_travellers, {
    field: 'Number of travellers',
    min: 1,
    max: 100,
  });
  if (travellers !== undefined) output.numberOfTravellers = travellers;
  const luggage = validatePositiveInt(body.luggageCount ?? body.luggage_count, {
    field: 'Luggage count',
    min: 0,
    max: 500,
  });
  if (luggage !== undefined) output.luggageCount = luggage;

  const acc = body.accommodationType ?? body.accommodation_type;
  if (acc !== undefined && acc !== null && acc !== '') {
    if (!ACCOMMODATION_TYPES.includes(acc)) {
      throw invalid(`Accommodation type must be one of: ${ACCOMMODATION_TYPES.join(', ')}.`);
    }
    output.accommodationType = acc;
  }

  const pkg = body.packageType ?? body.package_type;
  if (pkg !== undefined && pkg !== null && pkg !== '') {
    if (!PACKAGE_TYPES.includes(pkg)) {
      throw invalid(`Package type must be one of: ${PACKAGE_TYPES.join(', ')}.`);
    }
    output.packageType = pkg;
  }

  let hotel = toBoolean(body.hotelRequired ?? body.hotel_required, 'hotelRequired');
  let guide = toBoolean(body.guideRequired ?? body.guide_required, 'guideRequired');
  let driver = toBoolean(body.driverRequired ?? body.driver_required, 'driverRequired');

  // Package Type governs requested services consistency
  if (output.packageType === 'hotel_only') {
    hotel = true;
    driver = false;
    guide = false;
  } else if (output.packageType === 'vehicle_driver') {
    hotel = false;
    driver = true;
  } else if (output.packageType === 'guide_activities') {
    guide = true;
  } else if (output.packageType === 'full_package') {
    if (hotel === undefined) hotel = true;
    if (driver === undefined) driver = true;
    if (guide === undefined) guide = true;
  }

  if (hotel !== undefined) output.hotelRequired = hotel;
  if (guide !== undefined) output.guideRequired = guide;
  if (driver !== undefined) output.driverRequired = driver;

  const cruiseDur = body.cruiseDuration ?? body.cruise_duration;
  if (cruiseDur !== undefined && cruiseDur !== null && cruiseDur !== '') {
    if (!CRUISE_DURATIONS.includes(cruiseDur)) {
      throw invalid(`Cruise duration must be one of: ${CRUISE_DURATIONS.join(', ')}.`);
    }
    output.cruiseDuration = cruiseDur;
  } else if (output.packageType === 'blue_cruise') {
    throw invalid('Cruise duration is required for Blue Cruise requests.');
  }

  const special = optionalText(body.specialRequests ?? body.special_requests, {
    max: 5000,
    field: 'Special requests',
  });
  if (special !== undefined) output.specialRequests = special || null;

  const title = optionalText(body.title, { max: 255, field: 'Title' });
  if (title !== undefined) output.title = title || null;

  const days = validateDaysList(body.days);
  if (days !== undefined) output.days = days;

  return output;
}

export function validatePatchRequestInput(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Request body must be an object.');
  }
  if (body.routeId !== undefined || body.route !== undefined) {
    throw invalid('The route of a request cannot be changed. Create a new request instead.');
  }
  const full = validateCreateRequestInput({ routeId: 1, ...body });
  delete full.routeId;
  delete full.inlineRoute;
  return full;
}
