/**
 * Agency-matching controller (Phase 5): agency inbox + view tracking.
 */
import * as service from './matching.service.js';
import { validateInboxQuery } from './matching.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function roleOf(req) {
  return { role: req.user.role };
}

export const list = asyncHandler(async (req, res) => {
  const filters = validateInboxQuery(req.query);
  const { requests, pagination } = await service.listInboxRequests(
    req.user.id,
    filters,
    roleOf(req),
  );
  return successResponse(res, { data: { requests }, pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const request = await service.getInboxRequest(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { request } });
});

export const view = asyncHandler(async (req, res) => {
  const match = await service.markRequestViewed(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { match }, message: 'Request marked as viewed.' });
});
