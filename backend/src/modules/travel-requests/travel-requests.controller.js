/**
 * Travel-request controller (Phase 4).
 */
import * as service from './travel-requests.service.js';
import {
  validateCreateRequestInput,
  validatePatchRequestInput,
  validateDayInput,
} from './travel-requests.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function roleOf(req) {
  return { role: req.user.role };
}

export const create = asyncHandler(async (req, res) => {
  const input = validateCreateRequestInput(req.body);
  const request = await service.createRequest(req.user.id, input, roleOf(req));
  return successResponse(res, { data: { request }, message: 'Travel request draft created.' }, 201);
});

export const list = asyncHandler(async (req, res) => {
  const requests = await service.listRequests(req.user.id, roleOf(req));
  return successResponse(res, { data: { requests } });
});

export const getById = asyncHandler(async (req, res) => {
  const request = await service.getRequest(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { request } });
});

export const patch = asyncHandler(async (req, res) => {
  const patch = validatePatchRequestInput(req.body);
  const request = await service.patchRequest(req.user.id, req.params.id, patch, roleOf(req));
  return successResponse(res, { data: { request }, message: 'Travel request updated.' });
});

export const submit = asyncHandler(async (req, res) => {
  const request = await service.submitRequest(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { request }, message: 'Travel request submitted.' });
});

export const cancel = asyncHandler(async (req, res) => {
  const request = await service.cancelRequest(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { request }, message: 'Travel request cancelled.' });
});

export const addDay = asyncHandler(async (req, res) => {
  const day = validateDayInput(req.body);
  const created = await service.addDay(req.user.id, req.params.id, day, roleOf(req));
  return successResponse(res, { data: { day: created }, message: 'Day added.' }, 201);
});

export const patchDay = asyncHandler(async (req, res) => {
  const day = await service.patchDay(
    req.user.id,
    req.params.id,
    req.params.dayId,
    req.body,
    roleOf(req),
  );
  return successResponse(res, { data: { day }, message: 'Day updated.' });
});

export const deleteDay = asyncHandler(async (req, res) => {
  const result = await service.deleteDay(req.user.id, req.params.id, req.params.dayId, roleOf(req));
  return successResponse(res, { data: result, message: 'Day deleted.' });
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const result = await service.deleteRequest(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: result, message: result.message || 'Travel request deleted.' });
});
