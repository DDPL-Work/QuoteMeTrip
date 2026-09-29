/**
 * Authentication integration tests (Phase 3).
 *
 * HTTP-level coverage of the auth API surface plus service-level
 * Google identity tests (stubbed verifier — live Google is not
 * configured in test/CI):
 *
 *   register traveller/agency, duplicate + case-insensitive email,
 *   validation, login success/failure, user-enumeration resistance,
 *   suspended/inactive rejection, refresh rotation + replay detection,
 *   logout, logout-all, /me, protected + role authorization, security
 *   matrix (missing/invalid/expired/tampered/wrong-type tokens),
 *   corporate email policy, rate limiting, admin provisioning.
 *
 * Run against the ISOLATED test database only (NODE_ENV=test).
 * Prepare it first:
 *   npm run db:test:prepare --workspace=@troublefree/backend
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';
process.env.JWT_ACCESS_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';

import app from '../../src/app.js';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import { hashPassword } from '../../src/utils/password.js';
import { sha256Hex } from '../../src/utils/tokens.js';
import { authenticate } from '../../src/middleware/authenticate.js';
import { authorize } from '../../src/middleware/authorize.js';
import { createAuthRateLimiter } from '../../src/middleware/rateLimiter.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import {
  createAdminUser,
  loginWithGoogle,
  refreshSession,
} from '../../src/modules/auth/auth.service.js';

const suffix = Date.now().toString(36);
let emailCounter = 0;
const email = (name) => `${name}+${suffix}-${emailCounter++}@example.com`;

let db;
let models;
let server;
let baseUrl;

/* ------------------------------------------------------------------ */
/* HTTP + cookie-jar helpers                                           */
/* ------------------------------------------------------------------ */

function rawSetCookies(res) {
  return typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
}

function getCookies(res) {
  return rawSetCookies(res)
    .map((header) => header.split(';')[0])
    .join('; ');
}

function refreshCookieFrom(res) {
  const jar = getCookies(res);
  const match = jar.match(/tfh_refresh=([^;]*)/);
  return match ? `tfh_refresh=${match[1]}` : '';
}

async function api(method, path, { body, token, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, res };
}

const registerTraveller = (overrides = {}) =>
  api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Test Traveller',
      email: email('traveller'),
      password: 'password-123',
      firstName: 'Test',
      lastName: 'Traveller',
      ...overrides,
    },
  });

const registerAgency = (overrides = {}) =>
  api('POST', '/api/v1/auth/register/agency', {
    body: {
      agencyName: 'Test Agency Ltd',
      contactPerson: 'Amina Diallo',
      email: email('agency'),
      password: 'password-123',
      city: 'Dakar',
      country: 'Senegal',
      ...overrides,
    },
  });

const login = (emailAddress, password) =>
  api('POST', '/api/v1/auth/login', { body: { email: emailAddress, password } });

async function seedUser({ name, role, status = 'active', password = 'password-123' }) {
  const address = email(`${role}-${name.replace(/\W+/g, '').toLowerCase()}`);
  const user = await models.User.create({
    name,
    email: address,
    passwordHash: await hashPassword(password),
    role,
    status,
  });
  return { user, email: address, password };
}

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for auth integration tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  models = initModels(db);
  await migrateUp(db);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDatabase();
  resetSequelizeInstance();
});

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

describe('registration', () => {
  test('traveller registration succeeds and auto-logs-in', async () => {
    const { status, json, res } = await registerTraveller();
    assert.strictEqual(status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.message, 'Registration successful.');
    assert.strictEqual(json.data.user.role, 'traveller');
    assert.ok(json.data.user.id);
    assert.ok(json.data.accessToken);
    assert.strictEqual(json.data.refreshToken, undefined);
    assert.strictEqual(json.data.user.passwordHash, undefined);

    const setCookie = getCookies(res);
    assert.match(setCookie, /tfh_refresh=.+/);
    assert.match(rawSetCookies(res).join('; '), /httponly/i);

    const profile = await models.TravellerProfile.findOne({ where: { userId: json.data.user.id } });
    assert.ok(profile, 'traveller profile should be created in the same transaction');
    assert.strictEqual(profile.firstName, 'Test');
  });

  test('agency registration succeeds and auto-logs-in', async () => {
    const { status, json } = await registerAgency();
    assert.strictEqual(status, 201);
    assert.strictEqual(json.data.user.role, 'agency');

    const profile = await models.AgencyProfile.findOne({ where: { userId: json.data.user.id } });
    assert.ok(profile, 'agency profile should be created in the same transaction');
    assert.strictEqual(profile.agencyName, 'Test Agency Ltd');
  });

  test('duplicate email is rejected', async () => {
    const address = email('duplicate');
    const first = await registerTraveller({ email: address });
    assert.strictEqual(first.status, 201);

    const second = await registerTraveller({ email: address });
    assert.strictEqual(second.status, 409);
    assert.strictEqual(second.json.success, false);
    assert.strictEqual(second.json.error.code, 'AUTH_EMAIL_ALREADY_EXISTS');
  });

  test('duplicate email is rejected case-insensitively', async () => {
    const address = email('casedup');
    const first = await registerTraveller({ email: address });
    assert.strictEqual(first.status, 201);

    const second = await registerTraveller({ email: address.toUpperCase() });
    assert.strictEqual(second.status, 409);
  });

  test('invalid email and short password are rejected', async () => {
    const badEmail = await registerTraveller({ email: 'not-an-email' });
    assert.strictEqual(badEmail.status, 400);

    const shortPassword = await registerTraveller({ password: 'short' });
    assert.strictEqual(shortPassword.status, 400);
  });

  test('password confirmation mismatch is rejected', async () => {
    const { status } = await registerTraveller({ passwordConfirm: 'different-123' });
    assert.strictEqual(status, 400);
  });

  test('agency registration requires an agency name', async () => {
    const { status } = await registerAgency({ agencyName: '' });
    assert.strictEqual(status, 400);
  });

  test('no public admin registration endpoint exists', async () => {
    const { status } = await api('POST', '/api/v1/auth/register/admin', {
      body: { name: 'Evil', email: email('evil-admin'), password: 'password-123' },
    });
    assert.strictEqual(status, 404);
  });
});

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

describe('login', () => {
  test('correct credentials succeed and store only a token hash', async () => {
    const address = email('login-ok');
    await registerTraveller({ email: address });

    const { status, json, res } = await login(address, 'password-123');
    assert.strictEqual(status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.message, 'Login successful.');
    assert.strictEqual(json.data.user.email, address);
    assert.ok(json.data.accessToken);
    assert.strictEqual(json.data.refreshToken, undefined);
    assert.strictEqual(json.data.user.passwordHash, undefined);

    const jar = refreshCookieFrom(res);
    const raw = decodeURIComponent(jar.replace('tfh_refresh=', ''));
    const session = await models.AuthSession.findOne({ where: { tokenHash: sha256Hex(raw) } });
    assert.ok(session, 'session row should be keyed by the token hash');
    assert.notStrictEqual(session.tokenHash, raw);
    assert.ok(session.tokenFamily);
    assert.ok(session.expiresAt);
  });

  test('email lookup is case-insensitive and trimmed', async () => {
    const address = email('login-case');
    await registerTraveller({ email: address });
    const { status } = await login(`  ${address.toUpperCase()} `, 'password-123');
    assert.strictEqual(status, 200);
  });

  test('wrong password and unknown email give the same generic error', async () => {
    const address = email('login-fail');
    await registerTraveller({ email: address });

    const wrongPassword = await login(address, 'wrong-password-1');
    const unknownEmail = await login(email('nobody-here'), 'wrong-password-1');

    for (const attempt of [wrongPassword, unknownEmail]) {
      assert.strictEqual(attempt.status, 401);
      assert.strictEqual(attempt.json.error.code, 'AUTH_INVALID_CREDENTIALS');
      assert.strictEqual(attempt.json.error.message, 'Invalid email or password.');
    }
  });

  test('suspended and inactive accounts cannot log in', async () => {
    const suspended = await seedUser({
      name: 'Sue Spended',
      role: 'traveller',
      status: 'suspended',
    });
    const blocked = await login(suspended.email, suspended.password);
    assert.strictEqual(blocked.status, 403);
    assert.strictEqual(blocked.json.error.code, 'AUTH_ACCOUNT_SUSPENDED');

    const inactive = await seedUser({ name: 'Ina Ctive', role: 'agency', status: 'inactive' });
    const rejected = await login(inactive.email, inactive.password);
    assert.strictEqual(rejected.status, 403);
    assert.strictEqual(rejected.json.error.code, 'AUTH_ACCOUNT_INACTIVE');
  });

  test('login updates lastLoginAt', async () => {
    const address = email('login-stamp');
    const created = await registerTraveller({ email: address });
    const before = await models.User.findByPk(created.json.data.user.id);
    const firstLogin = before.lastLoginAt;

    await login(address, 'password-123');
    const after = await models.User.findByPk(created.json.data.user.id);
    assert.ok(after.lastLoginAt);
    assert.ok(!firstLogin || after.lastLoginAt >= firstLogin);
  });
});

/* ------------------------------------------------------------------ */
/* Current user + protected access                                     */
/* ------------------------------------------------------------------ */

describe('current user and protected access', () => {
  test('/me returns the sanitized identity with profile', async () => {
    const address = email('me-user');
    const created = await registerTraveller({ email: address, firstName: 'Meadow' });
    const token = created.json.data.accessToken;

    const { status, json } = await api('GET', '/api/v1/auth/me', { token });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.user.email, address);
    assert.strictEqual(json.data.user.role, 'traveller');
    assert.strictEqual(json.data.user.passwordHash, undefined);
    assert.strictEqual(json.data.user.profile.firstName, 'Meadow');
  });

  test('/me rejects anonymous requests', async () => {
    const { status, json } = await api('GET', '/api/v1/auth/me');
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_UNAUTHORIZED');
  });

  test('malformed authorization headers are rejected', async () => {
    const { status } = await api('GET', '/api/v1/auth/me', { token: 'not-a-jwt' });
    assert.strictEqual(status, 401);
  });

  test('tampered access token is rejected', async () => {
    const created = await registerTraveller();
    const tampered = `${created.json.data.accessToken.slice(0, -2)}aa`;
    const { status, json } = await api('GET', '/api/v1/auth/me', { token: tampered });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_TOKEN_INVALID');
  });

  test('expired access token is rejected', async () => {
    const created = await registerTraveller();
    const expired = jwt.sign(
      { sub: created.json.data.user.id, role: 'traveller', type: 'access', jti: 'expired-test' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-10s' },
    );
    const { status, json } = await api('GET', '/api/v1/auth/me', { token: expired });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_TOKEN_EXPIRED');
  });

  test('refresh token cannot be used as an access token', async () => {
    const created = await registerTraveller();
    const raw = decodeURIComponent(refreshCookieFrom(created.res).replace('tfh_refresh=', ''));
    const { status, json } = await api('GET', '/api/v1/auth/me', { token: raw });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_TOKEN_INVALID');
  });
});

/* ------------------------------------------------------------------ */
/* Refresh rotation + reuse detection                                  */
/* ------------------------------------------------------------------ */

describe('refresh rotation', () => {
  test('refresh issues a new access token and rotates the session', async () => {
    const created = await registerTraveller();
    const firstCookie = refreshCookieFrom(created.res);

    const refreshed = await api('POST', '/api/v1/auth/refresh', { cookie: firstCookie });
    assert.strictEqual(refreshed.status, 200);
    assert.ok(refreshed.json.data.accessToken);
    assert.strictEqual(refreshed.json.data.refreshToken, undefined);

    const secondCookie = refreshCookieFrom(refreshed.res);
    assert.ok(secondCookie);
    assert.notStrictEqual(secondCookie, firstCookie);

    const me = await api('GET', '/api/v1/auth/me', { token: refreshed.json.data.accessToken });
    assert.strictEqual(me.status, 200);
  });

  test('rotated refresh token cannot be replayed (family revoked)', async () => {
    const created = await registerTraveller();
    const firstCookie = refreshCookieFrom(created.res);

    const refreshed = await api('POST', '/api/v1/auth/refresh', { cookie: firstCookie });
    assert.strictEqual(refreshed.status, 200);

    const replay = await api('POST', '/api/v1/auth/refresh', { cookie: firstCookie });
    assert.strictEqual(replay.status, 401);
    assert.strictEqual(replay.json.error.code, 'AUTH_REFRESH_REUSED');

    // The whole token family is revoked: even the newest session dies.
    const dead = await api('POST', '/api/v1/auth/refresh', {
      cookie: refreshCookieFrom(refreshed.res),
    });
    assert.strictEqual(dead.status, 401);
  });

  test('refresh without a cookie is rejected', async () => {
    const { status, json } = await api('POST', '/api/v1/auth/refresh');
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_TOKEN_INVALID');
  });

  test('expired refresh token is rejected', async () => {
    const previous = process.env.JWT_REFRESH_EXPIRES_IN;
    process.env.JWT_REFRESH_EXPIRES_IN = '1s';
    let cookie = '';
    try {
      const created = await registerTraveller();
      cookie = refreshCookieFrom(created.res);
    } finally {
      process.env.JWT_REFRESH_EXPIRES_IN = previous;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const { status, json } = await api('POST', '/api/v1/auth/refresh', { cookie });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'AUTH_TOKEN_EXPIRED');
  });

  test('service-level expired refresh is rejected even with a valid session row', async () => {
    const created = await registerTraveller();
    const raw = decodeURIComponent(refreshCookieFrom(created.res).replace('tfh_refresh=', ''));
    const session = await models.AuthSession.findOne({ where: { tokenHash: sha256Hex(raw) } });
    await assert.rejects(
      refreshSession(
        jwt.sign(
          { sub: session.userId, type: 'refresh', sid: session.id, jti: 'stale' },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '-5s' },
        ),
      ),
      /expired/i,
    );
  });
});

/* ------------------------------------------------------------------ */
/* Logout                                                              */
/* ------------------------------------------------------------------ */

describe('logout', () => {
  test('logout revokes the current session and clears the cookie', async () => {
    const created = await registerTraveller();
    const cookie = refreshCookieFrom(created.res);

    const { status, res } = await api('POST', '/api/v1/auth/logout', { cookie });
    assert.strictEqual(status, 200);
    assert.match(rawSetCookies(res).join('; '), /tfh_refresh=;/);

    const retry = await api('POST', '/api/v1/auth/refresh', { cookie });
    assert.strictEqual(retry.status, 401);
    assert.strictEqual(retry.json.error.code, 'AUTH_SESSION_REVOKED');
  });

  test('logout without a cookie still succeeds (idempotent)', async () => {
    const { status } = await api('POST', '/api/v1/auth/logout');
    assert.strictEqual(status, 200);
  });

  test('logout-all revokes every session of the user', async () => {
    const address = email('logout-all');
    const first = await registerTraveller({ email: address });
    const second = await login(address, 'password-123');
    assert.strictEqual(second.status, 200);

    const all = await api('POST', '/api/v1/auth/logout-all', {
      token: first.json.data.accessToken,
    });
    assert.strictEqual(all.status, 200);
    assert.strictEqual(all.json.data.revoked, 2);

    for (const jar of [refreshCookieFrom(first.res), refreshCookieFrom(second.res)]) {
      const retry = await api('POST', '/api/v1/auth/refresh', { cookie: jar });
      assert.strictEqual(retry.status, 401);
    }
  });

  test('logout-all requires authentication', async () => {
    const { status } = await api('POST', '/api/v1/auth/logout-all');
    assert.strictEqual(status, 401);
  });
});

/* ------------------------------------------------------------------ */
/* Role authorization (test harness uses the real middleware)          */
/* ------------------------------------------------------------------ */

describe('role authorization', () => {
  let harness;
  let harnessUrl;

  before(async () => {
    const guarded = express();
    guarded.use(express.json());
    guarded.get('/admin-only', authenticate, authorize('admin'), (_req, res) => {
      res.json({ success: true, data: { area: 'admin' } });
    });
    guarded.get(
      '/traveller-or-agency',
      authenticate,
      authorize('traveller', 'agency'),
      (_req, res) => {
        res.json({ success: true });
      },
    );
    guarded.use(errorHandler);
    await new Promise((resolve) => {
      harness = guarded.listen(0, '127.0.0.1', resolve);
    });
    harnessUrl = `http://127.0.0.1:${harness.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => harness.close(resolve));
  });

  test('anonymous access is 401, wrong role is 403, right role passes', async () => {
    const anon = await fetch(`${harnessUrl}/admin-only`);
    assert.strictEqual(anon.status, 401);

    const traveller = await registerTraveller();
    const forbidden = await fetch(`${harnessUrl}/admin-only`, {
      headers: { Authorization: `Bearer ${traveller.json.data.accessToken}` },
    });
    assert.strictEqual(forbidden.status, 403);
    assert.strictEqual((await forbidden.json()).error.code, 'AUTH_FORBIDDEN');

    const allowed = await fetch(`${harnessUrl}/traveller-or-agency`, {
      headers: { Authorization: `Bearer ${traveller.json.data.accessToken}` },
    });
    assert.strictEqual(allowed.status, 200);

    const agency = await registerAgency();
    const agencyAllowed = await fetch(`${harnessUrl}/traveller-or-agency`, {
      headers: { Authorization: `Bearer ${agency.json.data.accessToken}` },
    });
    assert.strictEqual(agencyAllowed.status, 200);
  });

  test('admin identity passes the admin guard', async () => {
    const address = email('guard-admin');
    await createAdminUser({ email: address, name: 'Guard Admin', password: 'password-123' });
    const loggedIn = await login(address, 'password-123');
    assert.strictEqual(loggedIn.status, 200);

    const allowed = await fetch(`${harnessUrl}/admin-only`, {
      headers: { Authorization: `Bearer ${loggedIn.json.data.accessToken}` },
    });
    assert.strictEqual(allowed.status, 200);
  });
});

/* ------------------------------------------------------------------ */
/* Google identity (stubbed verifier — live Google not configured)     */
/* ------------------------------------------------------------------ */

describe('google login', () => {
  const stubGoogle =
    (overrides = {}) =>
    async () => ({
      providerUserId: `google-${suffix}-1`,
      email: email('google-user'),
      name: 'Google User',
      ...overrides,
    });

  test('new Google identity creates a traveller user + linked identity', async () => {
    const result = await loginWithGoogle('stub-token', {}, { verifyGoogle: stubGoogle() });
    assert.strictEqual(result.user.role, 'traveller');
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);

    const identity = await models.AuthIdentity.findOne({
      where: { provider: 'google', providerUserId: `google-${suffix}-1` },
    });
    assert.ok(identity);
    assert.strictEqual(identity.userId, result.user.id);
  });

  test('existing Google identity links back to the same user', async () => {
    const first = await loginWithGoogle('stub-token', {}, { verifyGoogle: stubGoogle() });
    const second = await loginWithGoogle('stub-token', {}, { verifyGoogle: stubGoogle() });
    assert.strictEqual(second.user.id, first.user.id);
  });

  test('Google login is rejected for agency accounts (email collision)', async () => {
    const agencyEmail = email('agency-google');
    await registerAgency({ email: agencyEmail });
    await assert.rejects(
      loginWithGoogle(
        'stub-token',
        {},
        {
          verifyGoogle: stubGoogle({
            providerUserId: `google-${suffix}-agency`,
            email: agencyEmail,
          }),
        },
      ),
      /not available for this account/,
    );
  });

  test('invalid provider token is rejected', async () => {
    await assert.rejects(
      loginWithGoogle(
        'bad-token',
        {},
        {
          verifyGoogle: async () => {
            const err = new Error('Invalid Google identity token.');
            err.statusCode = 401;
            throw err;
          },
        },
      ),
      /Invalid Google identity token/,
    );
  });

  test('HTTP google endpoint reports unconfigured provider honestly', async () => {
    assert.strictEqual(process.env.GOOGLE_CLIENT_ID || '', '');
    const { status, json } = await api('POST', '/api/v1/auth/google', {
      body: { idToken: 'anything' },
    });
    assert.strictEqual(status, 503);
    assert.strictEqual(json.error.code, 'AUTH_GOOGLE_NOT_CONFIGURED');
  });
});

/* ------------------------------------------------------------------ */
/* Corporate email policy + rate limiting + admin provisioning         */
/* ------------------------------------------------------------------ */

describe('policies and provisioning', () => {
  test('corporate policy rejects free providers when enabled', async () => {
    const previous = process.env.AGENCY_EMAIL_POLICY;
    process.env.AGENCY_EMAIL_POLICY = 'corporate';
    try {
      const gmail = await api('POST', '/api/v1/auth/register/agency', {
        body: {
          agencyName: 'Free Mail Agency',
          contactPerson: 'Free',
          email: `corporate-check+${suffix}@gmail.com`,
          password: 'password-123',
        },
      });
      assert.strictEqual(gmail.status, 400);
      assert.strictEqual(gmail.json.error.code, 'AUTH_EMAIL_NOT_CORPORATE');

      const corporate = await api('POST', '/api/v1/auth/register/agency', {
        body: {
          agencyName: 'Corporate Agency',
          contactPerson: 'Corp',
          email: `corporate-check+${suffix}@example-travel.co`,
          password: 'password-123',
        },
      });
      assert.strictEqual(corporate.status, 201);
    } finally {
      process.env.AGENCY_EMAIL_POLICY = previous;
    }
  });

  test('sensitive endpoints are rate limited (isolated harness)', async () => {
    const previous = process.env.AUTH_RATE_MAX;
    process.env.AUTH_RATE_MAX = '3';
    let limited;
    let limitedUrl;
    try {
      const guarded = express();
      guarded.use(express.json());
      guarded.post('/sensitive', createAuthRateLimiter(), (_req, res) => {
        res.json({ success: true });
      });
      await new Promise((resolve) => {
        limited = guarded.listen(0, '127.0.0.1', resolve);
      });
      limitedUrl = `http://127.0.0.1:${limited.address().port}/sensitive`;

      let lastStatus = 200;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await fetch(limitedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        lastStatus = res.status;
        if (res.status === 429) break;
      }
      assert.strictEqual(lastStatus, 429);
    } finally {
      process.env.AUTH_RATE_MAX = previous;
      if (limited) await new Promise((resolve) => limited.close(resolve));
    }
  });

  test('admin accounts are provisioned via the service (no public endpoint)', async () => {
    const address = email('provisioned-admin');
    const created = await createAdminUser({
      email: address,
      name: 'Provisioned Admin',
      password: 'password-123',
    });
    assert.strictEqual(created.role, 'admin');
    assert.strictEqual(created.passwordHash, undefined);

    const loggedIn = await login(address, 'password-123');
    assert.strictEqual(loggedIn.status, 200);
    assert.strictEqual(loggedIn.json.data.user.role, 'admin');

    await assert.rejects(
      createAdminUser({ email: address, name: 'Dupe', password: 'password-123' }),
      /already exists/,
    );
  });
});
