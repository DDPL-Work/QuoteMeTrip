/**
 * Authentication controller (Phase 3).
 *
 * Thin by design: input shaping lives in auth.validation.js, business
 * logic in auth.service.js, output shaping in auth.mapper.js. Errors
 * (AuthError and friends) flow to the centralized errorHandler.
 */
import * as service from './auth.service.js';
import {
  validateLoginInput,
  validateTravellerRegistration,
  validateAgencyRegistration,
  validateGoogleInput,
} from './auth.validation.js';
import { successResponse } from '../../utils/apiResponse.js';
import { getRefreshCookieName, setRefreshCookie, clearRefreshCookie } from '../../utils/cookies.js';

function contextFrom(req) {
  return { ip: req.ip, userAgent: req.get('user-agent') || null };
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function issueSessionResponse(res, result, { statusCode = 200, message }) {
  setRefreshCookie(res, result.refreshToken);
  return successResponse(
    res,
    { data: { user: result.user, accessToken: result.accessToken }, message },
    statusCode,
  );
}

export const registerTraveller = asyncHandler(async (req, res) => {
  const input = validateTravellerRegistration(req.body);
  const result = await service.registerTraveller(input, contextFrom(req));
  return issueSessionResponse(res, result, {
    statusCode: 201,
    message: 'Registration successful.',
  });
});

export const registerAgency = asyncHandler(async (req, res) => {
  const input = validateAgencyRegistration(req.body);
  const result = await service.registerAgency(input, contextFrom(req));
  return issueSessionResponse(res, result, {
    statusCode: 201,
    message: 'Registration successful.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const input = validateLoginInput(req.body);
  const result = await service.login(input, contextFrom(req));
  return issueSessionResponse(res, result, { message: 'Login successful.' });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = validateGoogleInput(req.body);
  const result = await service.loginWithGoogle(idToken, contextFrom(req));
  return issueSessionResponse(res, result, { message: 'Login successful.' });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies ? req.cookies[getRefreshCookieName()] : null;
  const result = await service.refreshSession(refreshToken, contextFrom(req));
  setRefreshCookie(res, result.refreshToken);
  return successResponse(res, { data: { accessToken: result.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies ? req.cookies[getRefreshCookieName()] : null;
  const result = await service.logout(refreshToken, contextFrom(req));
  clearRefreshCookie(res);
  return successResponse(res, { data: result, message: 'Logged out.' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  const result = await service.logoutAll(req.user.id, contextFrom(req));
  clearRefreshCookie(res);
  return successResponse(res, { data: result, message: 'Logged out from all sessions.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await service.getCurrentUser(req.user.id);
  return successResponse(res, { data: { user } });
});
