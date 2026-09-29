/**
 * Quotation routes (Phase 5).
 *
 * Agency (matched requests + own quotations only):
 *   POST /agency/travel-requests/:id/quotations  Create draft
 *   GET  /agency/quotations                      List own quotations
 *   GET  /agency/quotations/:id                  Own quotation detail
 *   PATCH /agency/quotations/:id                 Edit own draft
 *   POST /agency/quotations/:id/submit           draft -> submitted
 *   POST /agency/quotations/:id/withdraw         draft|submitted -> withdrawn
 *
 * Traveller (own requests only):
 *   GET /travel-requests/:id/quotations          Submitted quotations
 *   GET /quotations/:id                          Quotation detail
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './quotation.controller.js';

export const agencyQuotationRouter = Router();
agencyQuotationRouter.use(authenticate, authorize('agency'));
agencyQuotationRouter.post('/travel-requests/:id/quotations', controller.createForRequest);
agencyQuotationRouter.get('/quotations', controller.listMine);
agencyQuotationRouter.get('/quotations/:id', controller.getMine);
agencyQuotationRouter.patch('/quotations/:id', controller.patchMine);
agencyQuotationRouter.post('/quotations/:id/submit', controller.submitMine);
agencyQuotationRouter.post('/quotations/:id/withdraw', controller.withdrawMine);

export const travellerQuotationRouter = Router();
// NOTE: auth is applied per-route (not via router.use) because this
// router is mounted at '/'. Router-level auth would run for every
// unmatched API path and turn 404s into 401s.
travellerQuotationRouter.get(
  '/travel-requests/:id/quotations',
  authenticate,
  authorize('traveller'),
  controller.listForRequest,
);
travellerQuotationRouter.get(
  '/quotations/:id',
  authenticate,
  authorize('traveller'),
  controller.getForTraveller,
);
