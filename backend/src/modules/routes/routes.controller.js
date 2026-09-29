/**
 * Route controller (Phase 4).
 */
import * as service from './routes.service.js';
import { validateCalculateRouteInput, validateSaveRouteInput } from './routes.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

export const calculate = asyncHandler(async (req, res) => {
  const input = validateCalculateRouteInput(req.body);
  const result = await service.calculateRouteForTraveller(input);
  return successResponse(res, { data: { route: result } });
});

export const create = asyncHandler(async (req, res) => {
  // Accept either a fresh stop list (calculate + persist) or a
  // pre-calculated payload echoed back from POST /routes/calculate.
  const body = req.body || {};
  let calculated;
  if (body.stops) {
    const input = validateCalculateRouteInput(body);
    calculated = await service.calculateRouteForTraveller(input);
    const overrides = validateSaveRouteInput({});
    void overrides;
  } else {
    const patch = validateSaveRouteInput(body);
    const input = validateCalculateRouteInput({
      stops: (body.calculatedStops || []).map((s) => ({
        name: s.name || s.locationName,
        latitude: s.latitude,
        longitude: s.longitude,
        type: s.type || s.stopType,
        placeId: s.placeId,
      })),
    });
    calculated = await service.calculateRouteForTraveller(input);
    if (patch.recommendedDays !== undefined) calculated.recommendedDays = patch.recommendedDays;
    if (patch.totalDistanceKm !== undefined) calculated.distanceKm = patch.totalDistanceKm;
    if (patch.estimatedDurationMinutes !== undefined) {
      calculated.durationMinutes = patch.estimatedDurationMinutes;
    }
  }
  const overrides = validateSaveRouteInput(body);
  if (overrides.recommendedDays !== undefined)
    calculated.recommendedDays = overrides.recommendedDays;
  if (overrides.totalDistanceKm !== undefined) calculated.distanceKm = overrides.totalDistanceKm;
  if (overrides.estimatedDurationMinutes !== undefined) {
    calculated.durationMinutes = overrides.estimatedDurationMinutes;
  }
  if (overrides.startLocation !== undefined) calculated.startLocation = overrides.startLocation;
  if (overrides.finalDestination !== undefined)
    calculated.finalDestination = overrides.finalDestination;

  const route = await service.saveCalculatedRoute(req.user.id, calculated, {
    role: req.user.role,
  });
  return successResponse(res, { data: { route }, message: 'Route saved.' }, 201);
});

export const getById = asyncHandler(async (req, res) => {
  const route = await service.getRoute(req.user.id, req.params.id, { role: req.user.role });
  return successResponse(res, { data: { route } });
});

export const patch = asyncHandler(async (req, res) => {
  const patch = validateSaveRouteInput(req.body);
  const route = await service.patchRoute(req.user.id, req.params.id, patch, {
    role: req.user.role,
  });
  return successResponse(res, { data: { route }, message: 'Route updated.' });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteRoute(req.user.id, req.params.id, { role: req.user.role });
  return successResponse(res, { data: result, message: 'Route deleted.' });
});
