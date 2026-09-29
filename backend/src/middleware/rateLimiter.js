/**
 * Rate limiting middleware (Phase 3 & Phase 9).
 *
 * In-memory sliding window via express-rate-limit.
 * Applied to high-risk endpoints: login, registration, refresh, quotations,
 * messaging, contact forms, and admin operational actions.
 */
import { rateLimit } from 'express-rate-limit';
import { getAuthConfig } from '../config/auth.js';
import { AUTH_ERROR_CODES } from '../modules/auth/auth.constants.js';

export function createAuthRateLimiter() {
  const { rateLimit: limits } = getAuthConfig();
  return rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.RATE_LIMITED,
        message: 'Too many authentication attempts. Please try again later.',
      },
    },
  });
}

export function createQuotationRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Quotation rate limit exceeded. Please try again later.',
      },
    },
  });
}

export function createMessageRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Messaging rate limit exceeded. Please try again later.',
      },
    },
  });
}

export function createAdminRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Admin action rate limit exceeded. Please try again later.',
      },
    },
  });
}
