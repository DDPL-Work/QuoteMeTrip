/**
 * Job controller (Phase 6).
 */
import * as service from './job.service.js';
import { validateJobStatusInput } from './job.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

export const list = asyncHandler(async (req, res) => {
  const jobs = await service.listJobs(req.user.id, req.user.role);
  return successResponse(res, { data: { jobs } });
});

export const getById = asyncHandler(async (req, res) => {
  const job = await service.getJob(req.user.id, req.user.role, req.params.id);
  return successResponse(res, { data: { job } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const input = validateJobStatusInput(req.body);
  const job = await service.updateJobStatus(req.user.id, req.user.role, req.params.id, input);
  return successResponse(res, { data: { job }, message: 'Job status updated.' });
});
