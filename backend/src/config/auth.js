/**
 * Authentication configuration (Phase 3).
 *
 * Single source of truth for JWT, cookie, password, rate-limit, and
 * provider settings. Everything is environment-driven (see
 * `backend/.env.example`) — no secrets or production domains are
 * hard-coded here.
 */

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parse durations like "15m", "24h", "7d", "30s" (or plain seconds)
 * into milliseconds. Used for cookie Max-Age and DB session expiry.
 */
export function parseDurationToMs(value, fallbackMs) {
  if (value === undefined || value === null || value === '') {
    return fallbackMs;
  }
  const match = String(value)
    .trim()
    .match(/^(\d+)\s*([smhd])?$/i);
  if (!match) {
    return fallbackMs;
  }
  const amount = Number.parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function getAuthConfig() {
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    bcryptRounds: toInteger(process.env.AUTH_BCRYPT_ROUNDS, 12),
    passwordMinLength: toInteger(process.env.AUTH_PASSWORD_MIN_LENGTH, 8),

    cookie: {
      name: process.env.AUTH_COOKIE_NAME || 'tfh_refresh',
      path: process.env.AUTH_COOKIE_PATH || '/api/v1/auth',
      sameSite: process.env.AUTH_COOKIE_SAME_SITE || 'lax',
      // Secure in production; plain-HTTP local development opts out
      // explicitly via AUTH_COOKIE_SECURE=false.
      secure:
        process.env.AUTH_COOKIE_SECURE !== undefined
          ? process.env.AUTH_COOKIE_SECURE === 'true'
          : isProduction(),
    },

    rateLimit: {
      windowMs: toInteger(process.env.AUTH_RATE_WINDOW_MS, 15 * 60 * 1000),
      max: toInteger(process.env.AUTH_RATE_MAX, 100),
    },

    googleClientId: process.env.GOOGLE_CLIENT_ID || null,

    // 'open' = any valid email. 'corporate' = reject well-known free
    // providers (isolated list in auth.constants.js).
    agencyEmailPolicy: process.env.AGENCY_EMAIL_POLICY || 'open',
  };
}

/** Refresh-token lifetime in milliseconds (cookie Max-Age, DB expiry). */
export function getRefreshLifetimeMs() {
  const config = getAuthConfig();
  return parseDurationToMs(config.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000);
}
