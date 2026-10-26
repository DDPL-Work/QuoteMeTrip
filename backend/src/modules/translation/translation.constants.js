/**
 * Translation constants and allowlists.
 */

export const TRANSLATION_ERROR_CODES = {
  INVALID_LANGUAGE: 'TRANSLATION_INVALID_LANGUAGE',
  TEXT_TOO_LONG: 'TRANSLATION_TEXT_TOO_LONG',
  BATCH_TOO_LARGE: 'TRANSLATION_BATCH_TOO_LARGE',
  UNSUPPORTED_ENTITY: 'TRANSLATION_UNSUPPORTED_ENTITY',
  UNSUPPORTED_FIELD: 'TRANSLATION_UNSUPPORTED_FIELD',
  RATE_LIMITED: 'TRANSLATION_RATE_LIMITED',
  FORBIDDEN: 'TRANSLATION_FORBIDDEN',
  NOT_FOUND: 'TRANSLATION_NOT_FOUND',
  PROVIDER_ERROR: 'TRANSLATION_PROVIDER_ERROR',
  DISABLED: 'TRANSLATION_DISABLED',
  BUDGET_EXCEEDED: 'TRANSLATION_BUDGET_EXCEEDED',
};

/**
 * Strict allowlist of translatable fields by content type.
 * Structured business values, identifiers, prices, enum keys, and tax amounts
 * are NEVER translatable.
 */
export const ALLOWED_TRANSLATABLE_FIELDS = {
  travel_guide_article: ['title', 'summary', 'excerpt', 'content', 'seoTitle', 'seoDescription'],
  travel_guide_destination: ['name', 'tagline', 'description', 'shortDescription', 'summary'],
  travel_guide_region: ['name', 'description'],
  agency_profile: ['companyName', 'agencyName', 'description', 'bio', 'officeAddress', 'city'],
  travel_request: ['title', 'specialRequests', 'notes'],
  quotation: ['notes', 'termsAndConditions'],
  message: ['body'],
};

export const PUBLIC_CONTENT_TYPES = new Set([
  'travel_guide_article',
  'travel_guide_destination',
  'travel_guide_region',
  'agency_profile',
]);

export const PRIVATE_CONTENT_TYPES = new Set(['travel_request', 'quotation', 'message']);
