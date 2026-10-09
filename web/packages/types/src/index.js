// @troublefree/types
//
// Shared contracts for the QuoteMeTrip domains. Backend
// validation is authoritative — these constants mirror the backend
// ENUMs so the Traveller, Agency, and Admin apps never duplicate
// business vocabularies.

export const TYPES_PACKAGE_NAME = '@troublefree/types';

// --- Phase 4: traveller core -------------------------------------

export const ROUTE_STOP_TYPES = ['start', 'intermediate', 'final'];

export const TRAVEL_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'matching',
  'quoted',
  'accepted',
  'cancelled',
  'completed',
];

/** Phase 4 transitions only; later phases extend the lifecycle. */
export const TRAVEL_REQUEST_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  // Phase 6: acceptance closes the shopping phase for the request.
  submitted: ['cancelled', 'accepted'],
  matching: [],
  quoted: [],
  accepted: [],
  cancelled: [],
  completed: [],
};

export const ACCOMMODATION_TYPES = ['3_star', '4_star', '5_star', 's_class'];

export const ACCOMMODATION_LABELS = {
  '3_star': '3 Star',
  '4_star': '4 Star',
  '5_star': '5 Star',
  s_class: 'S Class',
};

export const PACKAGE_TYPES = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];

export const PACKAGE_LABELS = {
  blue_cruise: 'Blue Cruise',
  full_package: 'Full package',
  hotel_only: 'Hotel only',
  vehicle_driver: 'Vehicle + driver',
  guide_activities: 'Guide & activities',
};

export const CRUISE_DURATIONS = ['4d_3n', '6d_5n'];

export const CRUISE_DURATION_LABELS = {
  '4d_3n': '4 Days / 3 Nights',
  '6d_5n': '6 Days / 5 Nights',
};

// --- Phase 5: agency matching & quotations -------------------------

export const TRAVEL_REQUEST_AGENCY_STATUSES = [
  'matched',
  'viewed',
  'quoted',
  'declined',
  'expired',
  'withdrawn',
];

export const QUOTATION_STATUSES = [
  'draft',
  'submitted',
  'withdrawn',
  'expired',
  'accepted',
  'rejected',
];

/** Phase 5 quotation transitions only; acceptance arrives later. */
export const QUOTATION_TRANSITIONS = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['withdrawn'],
  withdrawn: [],
  expired: [],
  accepted: [],
  rejected: [],
};

export const QUOTATION_TYPES = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];

export const QUOTATION_TYPE_LABELS = {
  blue_cruise: 'Blue Cruise',
  full_package: 'Full package',
  hotel_only: 'Hotel only',
  vehicle_driver: 'Vehicle + driver',
  guide_activities: 'Guide & activities',
};

export const QUOTATION_ITEM_TYPES = ['hotel', 'vehicle', 'driver', 'guide', 'service', 'other'];

export const QUOTATION_ITEM_TYPE_LABELS = {
  hotel: 'Hotel',
  vehicle: 'Vehicle',
  driver: 'Driver',
  guide: 'Guide',
  service: 'Service',
  other: 'Other',
};

// --- Phase 6: messaging, acceptance & jobs -------------------------

export const CONVERSATION_STATUSES = ['active', 'closed'];

export const MESSAGE_TYPES = ['text', 'system'];

export const JOB_STATUSES = ['accepted', 'in_progress', 'completed', 'cancelled'];

/** Phase 6 job transitions only. */
export const JOB_TRANSITIONS = {
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const SOCKET_EVENTS = {
  MESSAGE: 'conversation:message',
  READ: 'conversation:read',
  UPDATED: 'conversation:updated',
  DELETED: 'conversation:deleted',
  DELETED_FOR_EVERYONE: 'MESSAGE_DELETED_FOR_EVERYONE',
};

// --- Phase 7: admin operations, memberships & commissions --------

export const AGENCY_ADMIN_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

export const DOCUMENT_VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'];

export const MEMBERSHIP_STATUSES = ['pending', 'active', 'expired', 'suspended', 'cancelled'];

export const COMMISSION_STATUSES = ['pending', 'confirmed', 'cancelled', 'paid'];

export const AUDIT_ACTIONS = [
  'agency.approved',
  'agency.rejected',
  'agency.suspended',
  'agency.reactivated',
  'document.verified',
  'document.rejected',
  'membership.created',
  'membership.activated',
  'membership.suspended',
  'membership.reactivated',
  'payment.confirmed',
  'commission.updated',
];

// --- Phase 5.3: onboarding, coverage & eligibility -------------

export const AGENCY_SERVICE_TYPES = [
  'hotel',
  'guide',
  'vehicle',
  'driver',
  'full_package',
  'blue_cruise',
];

export const AGENCY_SERVICE_LABELS = {
  hotel: 'Hotel accommodation',
  guide: 'Licensed tour guide',
  vehicle: 'Transport vehicle',
  driver: 'Private driver',
  full_package: 'Full package tours',
  blue_cruise: 'Blue Cruise gulet tours',
};

export const ELIGIBILITY_REASONS = [
  'USER_INACTIVE',
  'AGENCY_PENDING',
  'AGENCY_SUSPENDED',
  'AGENCY_REJECTED',
  'MEMBERSHIP_INACTIVE',
  'EMPTY_COVERAGE',
  'COVERAGE_MISMATCH',
  'EMPTY_SERVICES',
  'SERVICE_MISMATCH',
];

// --- Request-Centric Workspace Helpers ----------------------------

export const TRAVEL_REQUEST_DISPLAY_STATUSES = {
  draft: 'Draft',
  submitted: 'Submitted',
  matching: 'Matching',
  quoted: 'Quote Received',
  accepted: 'Booking Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/**
 * Resolves a human-friendly display name for a travel request.
 * Prioritizes destination / route data over generic IDs.
 *
 * Logic:
 * 1. Explicit request title if one exists (e.g. "Udaipur Holiday" or "Turkey Discovery Trip")
 * 2. Destination name (e.g. "Udaipur, India")
 * 3. Start → final destination (e.g. "Istanbul → Ephesus")
 * 4. Route summary from stops or days
 * 5. Safe fallback: "Travel Request"
 */
export function getTravelRequestDisplayName(request) {
  if (!request) return 'Travel Request';

  // If passed a plain string
  if (typeof request === 'string') {
    const trimmed = request.trim();
    if (trimmed && !/^Request\s*#?\d+$/i.test(trimmed)) {
      return trimmed;
    }
    return trimmed || 'Travel Request';
  }

  // 1. Explicit title if provided
  const explicitTitle = request.title || request.tripTitle;
  if (
    explicitTitle &&
    typeof explicitTitle === 'string' &&
    explicitTitle.trim() &&
    !/^Request\s*#?\d+$/i.test(explicitTitle.trim())
  ) {
    return explicitTitle.trim();
  }

  // 2. Direct destination field
  if (
    request.destination &&
    typeof request.destination === 'string' &&
    request.destination.trim() &&
    !/^Request\s*#?\d+$/i.test(request.destination.trim())
  ) {
    return request.destination.trim();
  }

  // 3. Route information
  const route = request.route;
  if (route) {
    const start = route.startLocation?.trim();
    const final = route.finalDestination?.trim();
    if (start && final && start.toLowerCase() !== final.toLowerCase()) {
      return `${start} → ${final}`;
    }
    if (final) return final;
    if (start) return start;

    if (Array.isArray(route.stops) && route.stops.length > 0) {
      const stopNames = route.stops
        .map((s) => (typeof s === 'string' ? s.trim() : s?.locationName?.trim() || s?.name?.trim()))
        .filter(Boolean);
      if (stopNames.length >= 2) {
        return `${stopNames[0]} → ${stopNames[stopNames.length - 1]}`;
      }
      if (stopNames.length === 1) {
        return stopNames[0];
      }
    }
  }

  // 4. Day-by-day itinerary locations
  if (Array.isArray(request.days) && request.days.length > 0) {
    const locations = request.days
      .map((d) => d?.location?.trim() || d?.title?.trim())
      .filter((loc) => Boolean(loc) && !/^Day\s*\d+/i.test(loc));
    if (locations.length > 0) {
      const uniqueLocs = [...new Set(locations)];
      if (uniqueLocs.length >= 2) {
        return `${uniqueLocs[0]} → ${uniqueLocs[uniqueLocs.length - 1]}`;
      }
      return uniqueLocs[0];
    }
  }

  // 5. Special cruise packages
  if (request.packageType === 'blue_cruise') {
    return 'Blue Cruise Voyage';
  }

  // 6. Safe fallback with secondary ID
  return request.id ? `Travel Request #${request.id}` : 'Travel Request';
}

/**
 * Format request identifier as QRY-xxxx
 */
export function formatRequestIdentifier(id) {
  if (!id) return '';
  return `QRY-${id}`;
}

