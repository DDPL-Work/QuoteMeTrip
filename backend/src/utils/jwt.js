/**
 * JWT utilities (Phase 3).
 *
 * Access tokens are short-lived and carry only authorization claims:
 * `{ sub, role, type: 'access', jti }`. Refresh tokens carry
 * `{ sub, type: 'refresh', sid, jti }` where `sid` is the server-side
 * session id. No passwords, hashes, or profile data ever enter a JWT.
 */
import jwt from 'jsonwebtoken';
import { getAuthConfig } from '../config/auth.js';
import { newTokenId } from './tokens.js';

function requireSecret(secret, name) {
  if (!secret) {
    throw new Error(
      `${name} is not configured. Set it in the environment (see backend/.env.example).`,
    );
  }
  return secret;
}

export function signAccessToken(user) {
  const config = getAuthConfig();
  const payload = {
    sub: user.id,
    role: user.role,
    type: 'access',
    jti: newTokenId(),
  };
  return jwt.sign(payload, requireSecret(config.accessSecret, 'JWT_ACCESS_SECRET'), {
    expiresIn: config.accessExpiresIn,
  });
}

export function signRefreshToken({ userId, sessionId }) {
  const config = getAuthConfig();
  const payload = {
    sub: userId,
    type: 'refresh',
    sid: sessionId,
    jti: newTokenId(),
  };
  return jwt.sign(payload, requireSecret(config.refreshSecret, 'JWT_REFRESH_SECRET'), {
    expiresIn: config.refreshExpiresIn,
  });
}

function verify(token, secret, expectedType) {
  const decoded = jwt.verify(token, secret);
  if (!decoded || decoded.type !== expectedType) {
    const err = new Error('Invalid token type.');
    err.name = 'InvalidTokenTypeError';
    throw err;
  }
  return decoded;
}

export function verifyAccessToken(token) {
  const config = getAuthConfig();
  return verify(token, requireSecret(config.accessSecret, 'JWT_ACCESS_SECRET'), 'access');
}

export function verifyRefreshToken(token) {
  const config = getAuthConfig();
  return verify(token, requireSecret(config.refreshSecret, 'JWT_REFRESH_SECRET'), 'refresh');
}
