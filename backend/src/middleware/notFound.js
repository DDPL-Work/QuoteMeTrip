import { errorResponse } from '../utils/apiResponse.js';

/**
 * Catches any request that did not match a defined route
 * and returns a structured JSON 404 instead of an HTML page.
 */
export function notFound(req, res) {
  return errorResponse(res, {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Route not found',
  });
}
