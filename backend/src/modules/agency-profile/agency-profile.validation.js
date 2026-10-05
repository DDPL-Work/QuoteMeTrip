import { AGENCY_SERVICE_TYPES } from '../../db/models/AgencyCapability.js';
import { ValidationError } from '../../utils/errors.js';
import { AGENCY_PROFILE_ERROR_CODES } from './agency-profile.constants.js';

export function validateCoverageInput(body = {}) {
  const { locations, services } = body;

  if (locations !== undefined && !Array.isArray(locations)) {
    throw new ValidationError('Locations must be an array of location names.', {
      code: AGENCY_PROFILE_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (services !== undefined && !Array.isArray(services)) {
    throw new ValidationError('Services must be an array of valid service types.', {
      code: AGENCY_PROFILE_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const sanitizedLocations = (locations || [])
    .map((loc) => (typeof loc === 'string' ? loc.trim() : ''))
    .filter(Boolean);

  const sanitizedServices = (services || []).filter((srv) => AGENCY_SERVICE_TYPES.includes(srv));

  if (services && services.some((srv) => !AGENCY_SERVICE_TYPES.includes(srv))) {
    throw new ValidationError(
      `Invalid service type. Allowed values: ${AGENCY_SERVICE_TYPES.join(', ')}`,
      { code: AGENCY_PROFILE_ERROR_CODES.VALIDATION_ERROR },
    );
  }

  return {
    locations: [...new Set(sanitizedLocations)],
    services: [...new Set(sanitizedServices)],
  };
}
