/**
 * Agency-matching constants (Phase 5).
 *
 * Eligibility mapping (documented product decision): the Phase 2
 * `agency_profiles.status` ENUM has no `active` value — `approved` is
 * the active-equivalent. An agency is match-eligible when:
 *   agency profile status = approved
 *   user status = active (role = agency)
 *   membership = active (status + within the startsAt/endsAt window)
 */
import { TRAVEL_REQUEST_AGENCY_STATUSES } from '../../db/models/TravelRequestAgency.js';

export const MATCH_ERROR_CODES = {
  VALIDATION_ERROR: 'MATCH_VALIDATION_ERROR',
  NOT_FOUND: 'MATCH_NOT_FOUND',
  FORBIDDEN: 'MATCH_FORBIDDEN',
  DUPLICATE: 'MATCH_DUPLICATE',
};

export { TRAVEL_REQUEST_AGENCY_STATUSES };

/** Profile statuses eligible to receive new matches. */
export const MATCH_ELIGIBLE_AGENCY_STATUSES = ['approved'];

/** Match statuses that still expose the request in the agency inbox. */
export const INBOX_VISIBLE_MATCH_STATUSES = ['matched', 'viewed', 'quoted'];

/** Agency is considered suspended for matching purposes. */
export const MATCH_SUSPENDED_AGENCY_STATUSES = ['suspended'];
