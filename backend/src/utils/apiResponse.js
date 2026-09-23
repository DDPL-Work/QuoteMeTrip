/**
 * Standard success response envelope used across the API.
 * Kept intentionally small in Phase 1 — expand as real endpoints are added.
 */
export function successResponse(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

/**
 * Standard error response envelope used across the API.
 */
export function errorResponse(
  res,
  { statusCode = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred' } = {},
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
