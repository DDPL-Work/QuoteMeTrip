import { errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/errors.js';

/**
 * Centralized Express error-handling middleware.
 * Must be registered last, after all routes.
 *
 * Phase 1 scope: catch unexpected errors and return a structured
 * JSON response. Domain-specific error mapping arrives with the
 * business modules in later phases.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return errorResponse(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });
  }

  console.error(err);

  return errorResponse(res, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
