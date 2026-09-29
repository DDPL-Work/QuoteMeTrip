/**
 * Traveller profile controller (Phase 4).
 */
import * as service from './traveller.service.js';
import { validateTravellerProfilePatch } from './traveller.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

export const getMe = asyncHandler(async (req, res) => {
  const profile = await service.getMyProfile(req.user.id);
  return successResponse(res, { data: { profile } });
});

export const patchMe = asyncHandler(async (req, res) => {
  const patch = validateTravellerProfilePatch(req.body);
  const profile = await service.updateMyProfile(req.user.id, patch);
  return successResponse(res, { data: { profile }, message: 'Profile updated.' });
});
