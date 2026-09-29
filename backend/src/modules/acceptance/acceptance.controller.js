/**
 * Quotation acceptance controller (Phase 6).
 */
import * as service from './acceptance.service.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

export const accept = asyncHandler(async (req, res) => {
  const result = await service.acceptQuotation(req.user.id, req.params.id, {
    role: req.user.role,
  });
  return successResponse(res, { data: result, message: 'Quotation accepted. Job created.' });
});
