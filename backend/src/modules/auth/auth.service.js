/**
 * Authentication service (Phase 3).
 *
 * Owns all auth business logic: registration, login, refresh rotation
 * with reuse detection, logout, Google identity linking, and admin
 * provisioning. Controllers stay thin; queries stay in the repository.
 *
 * Security-event auditing: there is no `audit_logs` table in the
 * Phase 2 schema, so authentication events are emitted as structured
 * `AUTH_*` console logs (safe metadata only — never secrets). A
 * persistent audit store can consume these events in a later phase.
 */
import { withTransaction } from '../../db/transaction.js';
import { initModels } from '../../db/models/index.js';
import * as repository from './auth.repository.js';
import { AuthError } from '../../utils/errors.js';
import {
  AUTH_ERROR_CODES,
  FREE_EMAIL_DOMAINS,
  GOOGLE_PROVIDER,
  SOCIAL_LOGIN_ROLES,
} from './auth.constants.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { sha256Hex, safeEqualHex, newTokenId } from '../../utils/tokens.js';
import { getAuthConfig, getRefreshLifetimeMs } from '../../config/auth.js';
import { toPublicUser } from './auth.mapper.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateName,
} from './auth.validation.js';

/** Structured security-event log. Safe metadata only — never secrets. */
export function authLog(event, fields = {}) {
  const safe = { ...fields };
  // Defensive: strip anything secret-like if a caller passes it by mistake.
  for (const key of ['password', 'token', 'refreshToken', 'accessToken', 'secret']) {
    delete safe[key];
  }
  console.log(JSON.stringify({ type: 'auth', event, at: new Date().toISOString(), ...safe }));
}

function invalidCredentials() {
  // Generic on purpose: never reveal whether the email exists.
  return new AuthError('Invalid email or password.', {
    statusCode: 401,
    code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  });
}

function assertAccountActive(user) {
  if (user.status === 'inactive') {
    throw new AuthError('This account is inactive.', {
      statusCode: 403,
      code: AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
    });
  }
  if (user.status === 'suspended') {
    throw new AuthError('This account has been suspended.', {
      statusCode: 403,
      code: AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
    });
  }
}

async function assertEmailAvailable(email, { transaction = null, registry = null } = {}) {
  const existing = await repository.findUserByEmail(email, { transaction, registry });
  if (existing) {
    throw new AuthError('An account with this email already exists.', {
      statusCode: 409,
      code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
    });
  }
}

function assertCorporateEmail(email) {
  const { agencyEmailPolicy } = getAuthConfig();
  if (agencyEmailPolicy !== 'corporate') {
    return;
  }
  const domain = email.split('@')[1] || '';
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    throw new AuthError('Agency registration requires a corporate email address.', {
      statusCode: 400,
      code: AUTH_ERROR_CODES.EMAIL_NOT_CORPORATE,
    });
  }
}

/**
 * Create a refresh session row + signed token pair for a user.
 * The stored `tokenHash` is SHA-256 over the JWT; the raw token only
 * ever travels in the HttpOnly cookie.
 */
async function issueSession(
  user,
  { ipAddress = null, userAgent = null, tokenFamily = null, transaction = null } = {},
) {
  const registry = initModels();
  const family = tokenFamily || newTokenId();
  const expiresAt = new Date(Date.now() + getRefreshLifetimeMs());

  const session = await repository.createSession(
    {
      userId: user.id,
      tokenHash: 'pending',
      tokenFamily: family,
      expiresAt,
      ipAddress,
      userAgent,
      lastUsedAt: new Date(),
    },
    { transaction, registry },
  );

  const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });
  await session.update({ tokenHash: sha256Hex(refreshToken) }, { transaction });

  return { session, refreshToken, accessToken: signAccessToken(user) };
}

async function publicUserWithProfile(user, { registry = null } = {}) {
  const profile = await repository.findProfileForUser(user, { registry });
  return toPublicUser(user, { profile });
}

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

export async function registerTraveller(input, context = {}) {
  const registry = initModels();
  const email = normalizeEmail(input.email);

  await assertEmailAvailable(email, { registry });

  const result = await withTransaction(async (t) => {
    const user = await repository.createUser(
      {
        name: input.name,
        email,
        passwordHash: await hashPassword(input.password),
        role: 'traveller',
        status: 'active',
      },
      { transaction: t, registry },
    );
    const profile = await repository.createTravellerProfile(
      {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      { transaction: t, registry },
    );
    const issued = await issueSession(user, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      transaction: t,
    });
    return { user, profile, ...issued };
  });

  authLog('AUTH_REGISTER', { userId: result.user.id, role: 'traveller', ip: context.ip });
  return {
    user: toPublicUser(result.user, { profile: result.profile }),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

export async function registerAgency(input, context = {}) {
  const registry = initModels();
  const email = normalizeEmail(input.email);

  assertCorporateEmail(email);
  await assertEmailAvailable(email, { registry });

  const result = await withTransaction(async (t) => {
    const user = await repository.createUser(
      {
        name: input.name,
        email,
        passwordHash: await hashPassword(input.password),
        role: 'agency',
        status: 'active',
      },
      { transaction: t, registry },
    );
    // Agency business status stays `pending` (Phase 2 default) — the
    // future admin approval workflow decides promotion. Login itself
    // is not blocked so agencies can use the portal meanwhile.
    const profile = await repository.createAgencyProfile(
      {
        userId: user.id,
        agencyName: input.agencyName,
        contactPerson: input.contactPerson,
        phone: input.phone,
        city: input.city,
        country: input.country,
      },
      { transaction: t, registry },
    );
    const issued = await issueSession(user, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      transaction: t,
    });
    return { user, profile, ...issued };
  });

  authLog('AUTH_REGISTER', { userId: result.user.id, role: 'agency', ip: context.ip });
  return {
    user: toPublicUser(result.user, { profile: result.profile }),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

/* ------------------------------------------------------------------ */
/* Login / refresh / logout                                            */
/* ------------------------------------------------------------------ */

export async function login({ email, password }, context = {}) {
  const registry = initModels();
  const normalized = normalizeEmail(email);
  const user = await repository.findUserByEmail(normalized, { registry });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    authLog('AUTH_LOGIN_FAILURE', { email: normalized, ip: context.ip });
    throw invalidCredentials();
  }

  try {
    assertAccountActive(user);
  } catch (err) {
    authLog('AUTH_ACCOUNT_BLOCKED', { userId: user.id, status: user.status, ip: context.ip });
    throw err;
  }

  await repository.updateUser(user, { lastLoginAt: new Date() });
  const issued = await issueSession(user, {
    ipAddress: context.ip,
    userAgent: context.userAgent,
  });

  authLog('AUTH_LOGIN_SUCCESS', { userId: user.id, role: user.role, ip: context.ip });
  return {
    user: await publicUserWithProfile(user, { registry }),
    accessToken: issued.accessToken,
    refreshToken: issued.refreshToken,
  };
}

export async function refreshSession(refreshToken, context = {}) {
  const registry = initModels();

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      throw new AuthError('Refresh token has expired.', {
        statusCode: 401,
        code: AUTH_ERROR_CODES.TOKEN_EXPIRED,
      });
    }
    throw new AuthError('Invalid refresh token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.TOKEN_INVALID,
    });
  }

  const session = await repository.findSessionById(decoded.sid, { registry });
  if (!session || !safeEqualHex(session.tokenHash, sha256Hex(refreshToken))) {
    throw new AuthError('Invalid refresh token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.TOKEN_INVALID,
    });
  }

  // Reuse detection: a revoked session presented again means the token
  // was replayed (or used after logout). Nuke the whole family when the
  // session was rotated; a plain logged-out session is simply rejected.
  if (session.revokedAt) {
    if (session.replacedBySessionId) {
      await repository.revokeFamilySessions(session.tokenFamily, { registry });
      authLog('AUTH_REFRESH_REUSED', {
        userId: session.userId,
        family: session.tokenFamily,
        ip: context.ip,
      });
      throw new AuthError('Refresh token was already used. Please log in again.', {
        statusCode: 401,
        code: AUTH_ERROR_CODES.REFRESH_REUSED,
      });
    }
    throw new AuthError('Refresh session has been revoked.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.SESSION_REVOKED,
    });
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new AuthError('Refresh token has expired.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.TOKEN_EXPIRED,
    });
  }

  const user = await repository.findUserById(session.userId, { registry });
  if (!user) {
    throw new AuthError('Invalid refresh token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.TOKEN_INVALID,
    });
  }
  assertAccountActive(user);

  // Rotation: new session in the same family, old session revoked and
  // linked to its replacement.
  const rotated = await withTransaction(async (t) => {
    const issued = await issueSession(user, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      tokenFamily: session.tokenFamily,
      transaction: t,
    });
    await session.update(
      { revokedAt: new Date(), replacedBySessionId: issued.session.id },
      { transaction: t },
    );
    return issued;
  });

  await session.update({ lastUsedAt: new Date() }).catch(() => {});
  authLog('AUTH_REFRESH', { userId: user.id, ip: context.ip });
  return { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
}

export async function logout(refreshToken, context = {}) {
  if (!refreshToken) {
    return { revoked: false };
  }
  const registry = initModels();
  const session = await repository.findSessionByTokenHash(sha256Hex(refreshToken), { registry });
  if (!session) {
    return { revoked: false };
  }
  await repository.revokeSession(session);
  authLog('AUTH_LOGOUT', { userId: session.userId, ip: context.ip });
  return { revoked: true };
}

export async function logoutAll(userId, context = {}) {
  const count = await repository.revokeAllUserSessions(userId);
  authLog('AUTH_LOGOUT_ALL', { userId, revoked: count, ip: context.ip });
  return { revoked: count };
}

export async function getCurrentUser(userId) {
  const registry = initModels();
  const user = await repository.findUserById(userId, { registry });
  if (!user) {
    throw new AuthError('User not found.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.UNAUTHORIZED,
    });
  }
  return publicUserWithProfile(user, { registry });
}

/* ------------------------------------------------------------------ */
/* Google identity                                                     */
/* ------------------------------------------------------------------ */

async function defaultGoogleVerifier(idToken) {
  const { googleClientId } = getAuthConfig();
  if (!googleClientId) {
    throw new AuthError('Google login is not configured.', {
      statusCode: 503,
      code: AUTH_ERROR_CODES.GOOGLE_NOT_CONFIGURED,
    });
  }
  let response;
  try {
    response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
  } catch {
    throw new AuthError('Could not verify Google identity token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.GOOGLE_TOKEN_INVALID,
    });
  }
  if (!response.ok) {
    throw new AuthError('Invalid Google identity token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.GOOGLE_TOKEN_INVALID,
    });
  }
  const data = await response.json();
  if (data.aud !== googleClientId) {
    throw new AuthError('Invalid Google identity token.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.GOOGLE_TOKEN_INVALID,
    });
  }
  if (data.email_verified !== true && data.email_verified !== 'true') {
    throw new AuthError('Google email address is not verified.', {
      statusCode: 401,
      code: AUTH_ERROR_CODES.GOOGLE_TOKEN_INVALID,
    });
  }
  return {
    providerUserId: String(data.sub),
    email: normalizeEmail(data.email),
    name: String(data.name || data.email || 'Traveller').slice(0, 120),
  };
}

export async function loginWithGoogle(idToken, context = {}, { verifyGoogle = null } = {}) {
  const registry = initModels();
  const verifier = verifyGoogle || defaultGoogleVerifier;
  const identity = await verifier(idToken);

  const existing = await repository.findIdentity(GOOGLE_PROVIDER, identity.providerUserId, {
    registry,
  });
  if (existing) {
    const user = await repository.findUserById(existing.userId, { registry });
    if (!user || !SOCIAL_LOGIN_ROLES.includes(user.role)) {
      throw new AuthError('Google login is not available for this account.', {
        statusCode: 403,
        code: AUTH_ERROR_CODES.GOOGLE_LOGIN_NOT_ALLOWED,
      });
    }
    assertAccountActive(user);
    await repository.updateUser(user, { lastLoginAt: new Date() });
    const issued = await issueSession(user, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });
    authLog('AUTH_GOOGLE_LOGIN_SUCCESS', { userId: user.id, linked: true, ip: context.ip });
    return {
      user: await publicUserWithProfile(user, { registry }),
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
    };
  }

  // No linked identity: match by verified provider email, else create.
  const linked = await withTransaction(async (t) => {
    let user = await repository.findUserByEmail(identity.email, { transaction: t, registry });
    if (user) {
      if (!SOCIAL_LOGIN_ROLES.includes(user.role)) {
        throw new AuthError('Google login is not available for this account.', {
          statusCode: 403,
          code: AUTH_ERROR_CODES.GOOGLE_LOGIN_NOT_ALLOWED,
        });
      }
      assertAccountActive(user);
      const existingUserIdentity = await repository.findIdentityForUser(user.id, GOOGLE_PROVIDER, {
        transaction: t,
        registry,
      });
      if (existingUserIdentity && existingUserIdentity.providerUserId !== identity.providerUserId) {
        throw new AuthError('This account is already linked to a different Google account.', {
          statusCode: 409,
          code: AUTH_ERROR_CODES.GOOGLE_IDENTITY_CONFLICT,
        });
      }
    } else {
      user = await repository.createUser(
        { name: identity.name, email: identity.email, role: 'traveller', status: 'active' },
        { transaction: t, registry },
      );
      await repository.createTravellerProfile({ userId: user.id }, { transaction: t, registry });
    }
    await repository.createIdentity(
      {
        userId: user.id,
        provider: GOOGLE_PROVIDER,
        providerUserId: identity.providerUserId,
        providerEmail: identity.email,
      },
      { transaction: t, registry },
    );
    await repository.updateUser(user, { lastLoginAt: new Date() }, { transaction: t });
    const issued = await issueSession(user, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      transaction: t,
    });
    return { user, issued };
  });

  authLog('AUTH_GOOGLE_LOGIN_SUCCESS', {
    userId: linked.user.id,
    linked: false,
    ip: context.ip,
  });
  return {
    user: await publicUserWithProfile(linked.user, { registry }),
    accessToken: linked.issued.accessToken,
    refreshToken: linked.issued.refreshToken,
  };
}

/* ------------------------------------------------------------------ */
/* Admin provisioning (CLI/script only — no public endpoint)           */
/* ------------------------------------------------------------------ */

export async function createAdminUser({ email, name, password }) {
  const registry = initModels();
  const normalized = validateEmail(email);
  const displayName = validateName(name, 'Name');
  const checked = validatePassword(password);

  await assertEmailAvailable(normalized, { registry });

  const user = await repository.createUser(
    {
      name: displayName,
      email: normalized,
      passwordHash: await hashPassword(checked),
      role: 'admin',
      status: 'active',
    },
    { registry },
  );
  authLog('AUTH_ADMIN_CREATED', { userId: user.id });
  return toPublicUser(user);
}
