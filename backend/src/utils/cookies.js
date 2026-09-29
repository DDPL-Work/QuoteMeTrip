/**
 * Refresh-cookie helpers (Phase 3).
 *
 * The refresh JWT lives in an HttpOnly cookie — never in JavaScript
 * storage and never in JSON bodies. Options are environment-driven
 * (see `src/config/auth.js`).
 */
import { getAuthConfig, getRefreshLifetimeMs } from '../config/auth.js';

export function getRefreshCookieOptions() {
  const { cookie } = getAuthConfig();
  return {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: getRefreshLifetimeMs(),
  };
}

export function getRefreshCookieName() {
  return getAuthConfig().cookie.name;
}

export function setRefreshCookie(res, refreshToken) {
  res.cookie(getRefreshCookieName(), refreshToken, getRefreshCookieOptions());
}

export function clearRefreshCookie(res) {
  const { cookie } = getAuthConfig();
  res.clearCookie(cookie.name, { path: cookie.path });
}
