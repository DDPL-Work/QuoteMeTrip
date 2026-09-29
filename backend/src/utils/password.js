/**
 * Password utilities (Phase 3).
 *
 * bcrypt hashing with a configurable cost factor. Plain-text passwords
 * must never reach the database, logs, responses, or JWTs — callers
 * hash immediately and discard the original.
 */
import bcrypt from 'bcryptjs';
import { getAuthConfig } from '../config/auth.js';

export async function hashPassword(password) {
  const { bcryptRounds } = getAuthConfig();
  return bcrypt.hash(password, bcryptRounds);
}

export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) {
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}

/**
 * Backend-authoritative password policy. Returns an error message
 * string when invalid, or null when the password is acceptable.
 */
export function validatePasswordPolicy(password) {
  const { passwordMinLength } = getAuthConfig();
  if (typeof password !== 'string' || password.length < passwordMinLength) {
    return `Password must be at least ${passwordMinLength} characters long.`;
  }
  return null;
}
