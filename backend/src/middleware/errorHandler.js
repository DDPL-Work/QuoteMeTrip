import { errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';
import { isAllowedOrigin } from '../config/cors.js';

/**
 * Centralized Express error-handling middleware (Phase 9 hardened).
 * Must be registered last, after all routes.
 *
 * Obscures internal SQL errors, filesystem paths, and stack traces
 * in production responses while logging structured details server-side.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logError(err.message || 'Unhandled error', err, {
    requestId: req.id,
    path: req.originalUrl || req.url,
    method: req.method,
    userId: req.user?.id,
  });

  // Preserve CORS headers on error responses for allowed origins so that
  // browsers do not mask server/database errors as generic CORS errors.
  const origin = req.headers?.origin;
  if (origin && isAllowedOrigin(origin) && !res.getHeader('access-control-allow-origin')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (err instanceof AppError) {
    return errorResponse(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Handle CORS rejection
  if (err.message && err.message.startsWith('Not allowed by CORS')) {
    return errorResponse(res, {
      statusCode: 403,
      code: 'CORS_FORBIDDEN',
      message: 'Cross-origin request forbidden',
    });
  }

  // Generic fallback for unhandled internal exceptions
  return errorResponse(res, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred. Please try again later.' : (err.message || 'Internal server error'),
  });
}
