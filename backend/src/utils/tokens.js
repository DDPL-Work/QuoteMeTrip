/**
 * Token helpers (Phase 3).
 *
 * Refresh tokens are stored as SHA-256 hashes only. Comparison uses a
 * timing-safe equality check to avoid leaking hash prefixes.
 */
import crypto from 'node:crypto';

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

export function safeEqualHex(a, b) {
  const bufferA = Buffer.from(a || '', 'utf8');
  const bufferB = Buffer.from(b || '', 'utf8');
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/** Generate a random token-family / JWT ID (UUID v4). */
export function newTokenId() {
  return crypto.randomUUID();
}
