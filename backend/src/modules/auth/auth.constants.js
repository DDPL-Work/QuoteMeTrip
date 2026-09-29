/**
 * Authentication constants (Phase 3).
 *
 * Stable machine-readable error codes plus the isolated corporate
 * email policy data. Business policy lives here — never in
 * controllers.
 */

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  REFRESH_REUSED: 'AUTH_REFRESH_REUSED',
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
  EMAIL_NOT_CORPORATE: 'AUTH_EMAIL_NOT_CORPORATE',
  GOOGLE_LOGIN_NOT_ALLOWED: 'AUTH_GOOGLE_LOGIN_NOT_ALLOWED',
  GOOGLE_NOT_CONFIGURED: 'AUTH_GOOGLE_NOT_CONFIGURED',
  GOOGLE_TOKEN_INVALID: 'AUTH_GOOGLE_TOKEN_INVALID',
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
};

export const AUTH_ROLES = ['traveller', 'agency', 'admin'];

// Only consulted when AGENCY_EMAIL_POLICY=corporate. Kept isolated so
// the client can adjust the rule without touching controllers.
export const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
];

export const GOOGLE_PROVIDER = 'google';

// Roles allowed to authenticate via Google/social login.
// Agency is deliberately excluded (product requirement).
export const SOCIAL_LOGIN_ROLES = ['traveller'];
