/**
 * Authentication middleware (Phase 3).
 *
 * Verifies the Bearer access token and attaches the identity to the
 * request as `req.user = { id, role, tokenId }`. No database lookup
 * happens here — account status is enforced at login/refresh time,
 * keeping per-request overhead to a single JWT verification.
 *
 * Failures: 401 AUTH_UNAUTHORIZED (missing), AUTH_TOKEN_EXPIRED,
 * AUTH_TOKEN_INVALID (malformed, tampered, or wrong token type).
 */
import { AuthError } from '../utils/errors.js';
import { AUTH_ERROR_CODES } from '../modules/auth/auth.constants.js';
import { verifyAccessToken } from '../utils/jwt.js';

function unauthorized(code, message) {
  return new AuthError(message, { statusCode: 401, code });
}

export function authenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme.toLowerCase() !== 'bearer') {
    return next(unauthorized(AUTH_ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role, tokenId: decoded.jti };
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return next(unauthorized(AUTH_ERROR_CODES.TOKEN_EXPIRED, 'Access token has expired.'));
    }
    return next(unauthorized(AUTH_ERROR_CODES.TOKEN_INVALID, 'Invalid access token.'));
  }
}
