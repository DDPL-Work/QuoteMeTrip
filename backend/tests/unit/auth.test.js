/**
 * Authentication unit tests (Phase 3).
 *
 * No database required: covers password hashing, JWT generation and
 * verification, token helpers, email normalization, the public user
 * mapper, role validation, and rate-limiter wiring.
 *
 * JWT secrets are test-only values injected here when the environment
 * does not provide them (CI sets real test values; see .github).
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';
process.env.JWT_ACCESS_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';

import assert from 'node:assert';
import { describe, test } from 'node:test';
import jwt from 'jsonwebtoken';

import { hashPassword, verifyPassword, validatePasswordPolicy } from '../../src/utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.js';
import { sha256Hex, safeEqualHex, newTokenId } from '../../src/utils/tokens.js';
import { toPublicUser } from '../../src/modules/auth/auth.mapper.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from '../../src/modules/auth/auth.validation.js';
import { AUTH_ROLES } from '../../src/modules/auth/auth.constants.js';
import { authorize } from '../../src/middleware/authorize.js';
import { createAuthRateLimiter } from '../../src/middleware/rateLimiter.js';

describe('password hashing', () => {
  test('hashes differ per password and verify correctly', async () => {
    const hash = await hashPassword('correct-horse-123');
    assert.ok(hash);
    assert.notStrictEqual(hash, 'correct-horse-123');
    assert.strictEqual(await verifyPassword('correct-horse-123', hash), true);
    assert.strictEqual(await verifyPassword('wrong-password', hash), false);
  });

  test('same password produces different hashes (unique salts)', async () => {
    const first = await hashPassword('same-password-1');
    const second = await hashPassword('same-password-1');
    assert.notStrictEqual(first, second);
  });

  test('missing inputs never verify', async () => {
    assert.strictEqual(await verifyPassword('', await hashPassword('x'.repeat(8))), false);
    assert.strictEqual(await verifyPassword('password1', null), false);
    assert.strictEqual(await verifyPassword(null, 'hash'), false);
  });

  test('password policy enforces the configured minimum length', () => {
    assert.strictEqual(
      validatePasswordPolicy('short'),
      'Password must be at least 8 characters long.',
    );
    assert.strictEqual(validatePasswordPolicy('long-enough-1'), null);
    assert.strictEqual(validatePasswordPolicy(''), 'Password must be at least 8 characters long.');
  });

  test('validatePassword throws a validation error for short passwords', () => {
    assert.throws(() => validatePassword('short'), /at least 8 characters/);
    assert.strictEqual(validatePassword('long-enough-1'), 'long-enough-1');
  });
});

describe('JWT access tokens', () => {
  const user = { id: 42, role: 'traveller' };

  test('access token carries only authorization claims', () => {
    const token = signAccessToken(user);
    const decoded = verifyAccessToken(token);
    assert.strictEqual(decoded.sub, 42);
    assert.strictEqual(decoded.role, 'traveller');
    assert.strictEqual(decoded.type, 'access');
    assert.ok(decoded.jti);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.strictEqual(decoded.password, undefined);
    assert.strictEqual(decoded.passwordHash, undefined);
  });

  test('access token expires after its configured lifetime', async () => {
    process.env.JWT_ACCESS_EXPIRES_IN = '1s';
    try {
      const token = signAccessToken(user);
      assert.ok(verifyAccessToken(token));
      await new Promise((resolve) => setTimeout(resolve, 1200));
      assert.throws(() => verifyAccessToken(token), { name: 'TokenExpiredError' });
    } finally {
      process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    }
  });

  test('tampered access token is rejected', () => {
    const token = signAccessToken(user);
    const tampered = `${token.slice(0, -2)}aa`;
    assert.throws(() => verifyAccessToken(tampered));
  });

  test('refresh token is rejected as an access token', () => {
    const refresh = signRefreshToken({ userId: 42, sessionId: 7 });
    // Secrets differ, so verification fails on the signature before the
    // type check — either way the token is unusable as an access token.
    assert.throws(() => verifyAccessToken(refresh));
  });

  test('token type is enforced when secrets match', () => {
    const previous = process.env.JWT_REFRESH_SECRET;
    process.env.JWT_REFRESH_SECRET = process.env.JWT_ACCESS_SECRET;
    try {
      const refresh = signRefreshToken({ userId: 42, sessionId: 7 });
      assert.throws(() => verifyAccessToken(refresh), /Invalid token type/);
    } finally {
      process.env.JWT_REFRESH_SECRET = previous;
    }
  });

  test('access token is rejected as a refresh token', () => {
    const access = signAccessToken(user);
    assert.throws(() => verifyRefreshToken(access));
  });

  test('token signed with another secret is rejected', () => {
    const foreign = jwt.sign({ sub: 1, role: 'admin', type: 'access' }, 'foreign-secret', {
      expiresIn: '15m',
    });
    assert.throws(() => verifyAccessToken(foreign), /invalid signature/);
  });
});

describe('JWT refresh tokens', () => {
  test('refresh token carries the session id and verifies', () => {
    const token = signRefreshToken({ userId: 9, sessionId: 3 });
    const decoded = verifyRefreshToken(token);
    assert.strictEqual(decoded.sub, 9);
    assert.strictEqual(decoded.sid, 3);
    assert.strictEqual(decoded.type, 'refresh');
    assert.ok(decoded.jti);
  });
});

describe('token helpers', () => {
  test('SHA-256 hashes are stable, hex, and non-reversible in storage', () => {
    const hash = sha256Hex('raw-refresh-token');
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.strictEqual(hash, sha256Hex('raw-refresh-token'));
    assert.notStrictEqual(hash, 'raw-refresh-token');
  });

  test('timing-safe comparison behaves correctly', () => {
    assert.strictEqual(safeEqualHex('abc123', 'abc123'), true);
    assert.strictEqual(safeEqualHex('abc123', 'abc124'), false);
    assert.strictEqual(safeEqualHex('abc', 'abcd'), false);
  });

  test('token ids are unique', () => {
    assert.notStrictEqual(newTokenId(), newTokenId());
  });
});

describe('email normalization', () => {
  test('trims and lowercases consistently', () => {
    assert.strictEqual(normalizeEmail('  Alice@Example.COM '), 'alice@example.com');
    assert.strictEqual(normalizeEmail('BOB@EXAMPLE.COM'), 'bob@example.com');
  });

  test('invalid emails are rejected', () => {
    for (const bad of ['', 'not-an-email', 'a@b', 'x'.repeat(200) + '@example.com']) {
      assert.throws(() => validateEmail(bad), /valid email/i);
    }
  });

  test('valid email normalizes on validation', () => {
    assert.strictEqual(validateEmail('  Mixed@Example.com '), 'mixed@example.com');
  });
});

describe('public user mapping', () => {
  test('exposes only safe fields', () => {
    const user = {
      get: () => ({
        id: 1,
        name: 'Ada',
        email: 'ada@example.com',
        role: 'traveller',
        status: 'active',
        passwordHash: '$2b$12$secret',
        extra: 'dropped',
      }),
    };
    const publicUser = toPublicUser(user, {
      profile: { get: () => ({ id: 5, userId: 1, firstName: 'Ada' }) },
    });
    assert.deepStrictEqual(publicUser, {
      id: 1,
      name: 'Ada',
      email: 'ada@example.com',
      role: 'traveller',
      status: 'active',
      profile: { id: 5, firstName: 'Ada' },
    });
    assert.strictEqual('passwordHash' in publicUser, false);
  });

  test('null user maps to null', () => {
    assert.strictEqual(toPublicUser(null), null);
  });
});

describe('role validation', () => {
  test('supported roles are exactly traveller, agency, admin', () => {
    assert.deepStrictEqual([...AUTH_ROLES].sort(), ['admin', 'agency', 'traveller']);
  });

  test('authorize() rejects unknown roles at wiring time', () => {
    assert.throws(() => authorize('superadmin'), /unknown role/);
  });

  test('authorize() allows matching roles and forbids others', async () => {
    const onlyAdmin = authorize('admin');
    const calls = [];
    const next = (err) => calls.push(err);

    onlyAdmin({ user: { id: 1, role: 'admin' } }, {}, next);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0], undefined);

    onlyAdmin({ user: { id: 2, role: 'traveller' } }, {}, next);
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[1].statusCode, 403);
    assert.strictEqual(calls[1].code, 'AUTH_FORBIDDEN');

    onlyAdmin({}, {}, next);
    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[2].statusCode, 401);
  });
});

describe('auth rate limiter', () => {
  test('factory returns an Express middleware function', () => {
    const limiter = createAuthRateLimiter();
    assert.strictEqual(typeof limiter, 'function');
  });
});
