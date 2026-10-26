/**
 * Search-to-Trip URL and State Mapping Utility
 *
 * Provides bidirectional translation between public homepage search panel
 * and authenticated Plan My Trip workflow.
 */

export const CANONICAL_SCOPES = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];

export const CANONICAL_SCOPE_MAP = {
  BLUE_CRUISE: 'blue_cruise',
  FULL_PACKAGE: 'full_package',
  HOTEL_ONLY: 'hotel_only',
  VEHICLE_DRIVER: 'vehicle_driver',
  GUIDE_ACTIVITIES: 'guide_activities',
};

export const SCOPE_LABELS = {
  blue_cruise: 'Blue Cruise',
  full_package: 'Full Package',
  hotel_only: 'Hotel Only',
  vehicle_driver: 'Vehicle + Driver',
  guide_activities: 'Guide & Activities',
};

/**
 * Normalizes any category string (label, slug, query param, or variant)
 * into a canonical backend packageType enum value.
 */
export function normalizeScope(rawScope) {
  if (!rawScope || typeof rawScope !== 'string') return CANONICAL_SCOPE_MAP.FULL_PACKAGE;
  const s = rawScope.toLowerCase().trim();
  if (s === 'blue_cruise' || s.includes('cruise') || s.includes('blue')) {
    return CANONICAL_SCOPE_MAP.BLUE_CRUISE;
  }
  if (s === 'hotel_only' || s.includes('hotel')) {
    return CANONICAL_SCOPE_MAP.HOTEL_ONLY;
  }
  if (
    s === 'vehicle_driver' ||
    s === 'vehicle_+_driver' ||
    s.includes('vehicle') ||
    s.includes('driver')
  ) {
    return CANONICAL_SCOPE_MAP.VEHICLE_DRIVER;
  }
  if (
    s === 'guide_activities' ||
    s === 'guide_&_activities' ||
    s.includes('guide') ||
    s.includes('activit')
  ) {
    return CANONICAL_SCOPE_MAP.GUIDE_ACTIVITIES;
  }
  if (s === 'full_package' || s.includes('full') || s.includes('package')) {
    return CANONICAL_SCOPE_MAP.FULL_PACKAGE;
  }
  return CANONICAL_SCOPE_MAP.FULL_PACKAGE;
}

export function scopeToLabel(scope) {
  const canonical = normalizeScope(scope);
  return SCOPE_LABELS[canonical] || 'Full Package';
}

/**
 * Calculates end date in YYYY-MM-DD from start date and duration days.
 */
export function calculateEndDate(startDateStr, durationDays) {
  if (!startDateStr || !durationDays || durationDays < 1) return '';
  try {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + (Number(durationDays) - 1));
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Validates a YYYY-MM-DD date string.
 */
export function isValidDateStr(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  return !Number.isNaN(Date.parse(trimmed));
}

/**
 * Serializes public search state to query string for /plan-trip.
 */
export function serializeSearchToQuery(trip = {}, scope = 'Full package') {
  const params = new URLSearchParams();

  const country = (trip.country || '').trim();
  if (country) {
    params.set('country', country);
  }

  const startDate = trip.startDate || trip.days?.[0]?.date || trip.travelStartDate || '';
  if (isValidDateStr(startDate)) {
    params.set('startDate', startDate.trim());
  }

  const days = Number(trip.days ?? trip.daysCount ?? trip.chosenDuration ?? 7);
  if (Number.isInteger(days) && days >= 1 && days <= 30) {
    params.set('days', String(days));
  } else {
    params.set('days', '7');
  }

  const travellers = Number(trip.travellers ?? trip.numberOfTravellers ?? 2);
  if (Number.isInteger(travellers) && travellers >= 1 && travellers <= 100) {
    params.set('travellers', String(travellers));
  } else {
    params.set('travellers', '2');
  }

  const canonicalScope = normalizeScope(scope);
  params.set('scope', canonicalScope);

  if (Boolean(trip.flexible || trip.isFlexibleDates)) {
    params.set('flexible', 'true');
  }

  if (Boolean(trip.suggest || trip.suggestRoute)) {
    params.set('suggest', 'true');
  }

  return params.toString();
}

/**
 * Safely parses and validates search query parameters from URL string or URLSearchParams.
 */
export function parseSearchParams(searchStringOrParams) {
  const params =
    searchStringOrParams instanceof URLSearchParams
      ? searchStringOrParams
      : new URLSearchParams(searchStringOrParams || '');

  // 1. Country / Destination
  const rawCountry = params.get('country') || params.get('destination') || 'Türkiye';
  const country =
    typeof rawCountry === 'string' && rawCountry.trim().length <= 100
      ? rawCountry.trim()
      : 'Türkiye';

  // 2. Start Date
  const rawStartDate = params.get('startDate') || params.get('travelStartDate') || '';
  const startDate = isValidDateStr(rawStartDate) ? rawStartDate.trim() : '';

  // 3. Duration Days
  const rawDays = params.get('days') || params.get('duration') || params.get('daysCount') || '7';
  const parsedDays = parseInt(rawDays, 10);
  const days =
    Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= 30 ? parsedDays : 7;

  // 4. Travellers
  const rawTravellers =
    params.get('travellers') || params.get('numberOfTravellers') || '2';
  const parsedTravellers = parseInt(rawTravellers, 10);
  const travellers =
    Number.isInteger(parsedTravellers) && parsedTravellers >= 1 && parsedTravellers <= 100
      ? parsedTravellers
      : 2;

  // 5. Scope
  const rawScope = params.get('scope') || params.get('packageType') || 'full_package';
  const scope = normalizeScope(rawScope);

  // 6. Preferences
  const rawFlexible =
    params.get('flexible') || params.get('flexibleDates') || params.get('isFlexibleDates');
  const flexible = rawFlexible === 'true' || rawFlexible === '1';

  const rawSuggest = params.get('suggest') || params.get('suggestRoute');
  const suggest = rawSuggest === 'true' || rawSuggest === '1';

  // Computed End Date
  const travelEndDate = startDate ? calculateEndDate(startDate, days) : '';

  // Category-specific service defaults
  let hotelRequired = true;
  let driverRequired = true;
  let guideRequired = true;

  if (scope === CANONICAL_SCOPE_MAP.HOTEL_ONLY) {
    hotelRequired = true;
    driverRequired = false;
    guideRequired = false;
  } else if (scope === CANONICAL_SCOPE_MAP.VEHICLE_DRIVER) {
    hotelRequired = false;
    driverRequired = true;
    guideRequired = false;
  } else if (scope === CANONICAL_SCOPE_MAP.GUIDE_ACTIVITIES) {
    hotelRequired = false;
    driverRequired = false;
    guideRequired = true;
  } else if (scope === CANONICAL_SCOPE_MAP.BLUE_CRUISE) {
    hotelRequired = true;
    driverRequired = false;
    guideRequired = false;
  }

  const cruiseDuration =
    scope === CANONICAL_SCOPE_MAP.BLUE_CRUISE ? (days >= 6 ? '6d_5n' : '4d_3n') : undefined;

  return {
    country,
    startDate,
    days,
    travellers,
    scope,
    flexible,
    suggest,
    travelEndDate,
    hotelRequired,
    driverRequired,
    guideRequired,
    cruiseDuration,
  };
}
