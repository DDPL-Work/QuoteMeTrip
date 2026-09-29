/**
 * Base application error.
 *
 * Later phases will extend this with domain-specific errors
 * (ValidationError, AuthError, NotFoundError, etc.) once business
 * modules exist. Kept minimal in Phase 1.
 */
export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR' } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, AppError);
  }
}

/**
 * Authentication/authorization failure.
 *
 * Carries a stable machine-readable `code` (see auth.constants.js)
 * plus the HTTP status. Messages are safe to show to end users —
 * they never reveal whether an email exists, and never include
 * secrets or tokens.
 */
export class AuthError extends AppError {
  constructor(message, { statusCode = 401, code = 'AUTH_UNAUTHORIZED' } = {}) {
    super(message, { statusCode, code });
    this.name = 'AuthError';
    Error.captureStackTrace?.(this, AuthError);
  }
}

/**
 * Backend-authoritative input validation failure (Phase 4+).
 *
 * Thrown by business-module validators. Always 400 with a stable
 * machine-readable code so the frontend can render friendly messages.
 */
export class ValidationError extends AppError {
  constructor(message, { code = 'VALIDATION_ERROR', details = null } = {}) {
    super(message, { statusCode: 400, code });
    this.name = 'ValidationError';
    this.details = details;
    Error.captureStackTrace?.(this, ValidationError);
  }
}

/**
 * Resource not found (Phase 4+).
 *
 * Used for genuinely missing resources AND cross-owner lookups
 * (a Traveller must never learn that another Traveller's route or
 * request exists — those lookups behave as missing for that user).
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', { code = 'NOT_FOUND' } = {}) {
    super(message, { statusCode: 404, code });
    this.name = 'NotFoundError';
    Error.captureStackTrace?.(this, NotFoundError);
  }
}

/**
 * Authenticated but forbidden (Phase 4+).
 *
 * Used for role mismatches enforced in services as a second layer
 * behind the `authorize()` middleware (defense in depth).
 */
export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to access this resource.',
    { code = 'FORBIDDEN' } = {},
  ) {
    super(message, { statusCode: 403, code });
    this.name = 'ForbiddenError';
    Error.captureStackTrace?.(this, ForbiddenError);
  }
}
