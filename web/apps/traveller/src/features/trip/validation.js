// Frontend-only validation helpers (Phase 4). Backend remains authoritative.

export function isValidLatitude(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

export function isValidLongitude(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

export function validateStopInput({ name, latitude, longitude }) {
  const errors = {};
  if (!name || !String(name).trim()) errors.name = 'Stop name is required.';
  if (!isValidLatitude(latitude)) errors.latitude = 'Latitude must be between -90 and 90.';
  if (!isValidLongitude(longitude)) errors.longitude = 'Longitude must be between -180 and 180.';
  return errors;
}

export function isValidDateOnly(value) {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  return !Number.isNaN(Date.parse(String(value)));
}

export function validateRequestInput({
  travelStartDate,
  travelEndDate,
  numberOfTravellers,
  luggageCount,
  packageType,
  cruiseDuration,
}) {
  const errors = {};
  if (travelStartDate && !isValidDateOnly(travelStartDate))
    errors.travelStartDate = 'Start date must be YYYY-MM-DD.';
  if (travelEndDate && !isValidDateOnly(travelEndDate))
    errors.travelEndDate = 'End date must be YYYY-MM-DD.';
  if (
    isValidDateOnly(travelStartDate) &&
    isValidDateOnly(travelEndDate) &&
    travelEndDate < travelStartDate
  ) {
    errors.travelEndDate = 'End date cannot be before the start date.';
  }
  const travellers = Number(numberOfTravellers);
  if (
    numberOfTravellers !== undefined &&
    numberOfTravellers !== '' &&
    (!Number.isInteger(travellers) || travellers < 1 || travellers > 100)
  ) {
    errors.numberOfTravellers = 'Travellers must be 1–100.';
  }
  const luggage = Number(luggageCount);
  if (
    luggageCount !== undefined &&
    luggageCount !== '' &&
    (!Number.isInteger(luggage) || luggage < 0 || luggage > 500)
  ) {
    errors.luggageCount = 'Luggage must be 0–500.';
  }
  if (
    packageType === 'blue_cruise' &&
    (!cruiseDuration || !['4d_3n', '6d_5n'].includes(cruiseDuration))
  ) {
    errors.cruiseDuration = 'Please select a cruise duration.';
  }
  return errors;
}

export const ACCOMMODATION_OPTIONS = ['3_star', '4_star', '5_star', 's_class'];
export const PACKAGE_OPTIONS = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];
export const CRUISE_DURATIONS = ['4d_3n', '6d_5n'];
export const STOP_TYPES = ['start', 'intermediate', 'final'];
