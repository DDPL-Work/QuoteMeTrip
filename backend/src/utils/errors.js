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
