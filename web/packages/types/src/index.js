// @troublefree/types
//
// Shared contracts for the Troublefree Holiday domains. Backend
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
