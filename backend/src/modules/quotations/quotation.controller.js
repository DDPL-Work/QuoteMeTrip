/**
 * Quotation controller (Phase 5): agency + traveller endpoints.
 */
import * as service from './quotation.service.js';
import {
  validateCreateQuotationInput,
  validatePatchQuotationInput,
} from './quotation.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function roleOf(req) {
  return { role: req.user.role };
}

export const createForRequest = asyncHandler(async (req, res) => {
  const input = validateCreateQuotationInput(req.body);
  const quotation = await service.createQuotation(req.user.id, req.params.id, input, roleOf(req));
  return successResponse(res, { data: { quotation }, message: 'Quotation draft created.' }, 201);
});

export const listMine = asyncHandler(async (req, res) => {
  const quotations = await service.listAgencyQuotations(req.user.id, roleOf(req));
  return successResponse(res, { data: { quotations } });
});

export const getMine = asyncHandler(async (req, res) => {
  const quotation = await service.getAgencyQuotation(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { quotation } });
});

export const patchMine = asyncHandler(async (req, res) => {
  const patch = validatePatchQuotationInput(req.body);
  const quotation = await service.patchQuotation(req.user.id, req.params.id, patch, roleOf(req));
  return successResponse(res, { data: { quotation }, message: 'Quotation updated.' });
});

export const submitMine = asyncHandler(async (req, res) => {
  const quotation = await service.submitQuotation(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { quotation }, message: 'Quotation submitted.' });
});

export const withdrawMine = asyncHandler(async (req, res) => {
  const quotation = await service.withdrawQuotation(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { quotation }, message: 'Quotation withdrawn.' });
});

export const listForRequest = asyncHandler(async (req, res) => {
  const quotations = await service.listRequestQuotations(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { quotations } });
});

export const getForTraveller = asyncHandler(async (req, res) => {
  const quotation = await service.getQuotationForTraveller(req.user.id, req.params.id, roleOf(req));
  return successResponse(res, { data: { quotation } });
});
