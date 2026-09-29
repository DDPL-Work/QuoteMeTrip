/**
 * Role authorization middleware (Phase 3).
 *
 * Usage: `authorize('admin')`, `authorize('traveller', 'agency')`.
 * Must run after `authenticate`. Authenticated users with a
 * non-matching role receive 403 AUTH_FORBIDDEN; requests without an
 * identity receive 401. Backend authorization is the final authority —
 * frontend guards are UX only.
 */
import { AuthError } from '../utils/errors.js';
import { AUTH_ERROR_CODES, AUTH_ROLES } from '../modules/auth/auth.constants.js';

export function authorize(...allowedRoles) {
  const roles = allowedRoles.flat();
  for (const role of roles) {
    if (!AUTH_ROLES.includes(role)) {
      throw new Error(`authorize() received unknown role: ${role}`);
    }
  }

  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AuthError('Authentication required.', {
          statusCode: 401,
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
        }),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AuthError('You do not have permission to access this resource.', {
          statusCode: 403,
          code: AUTH_ERROR_CODES.FORBIDDEN,
        }),
      );
    }
    return next();
  };
}
