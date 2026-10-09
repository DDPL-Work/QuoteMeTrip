/**
 * Travel-request routes (Phase 4).
 *
 *   POST   /travel-requests                 Create draft (routeId | inline route + days, transactional)
 *   GET    /travel-requests                 List own requests
 *   GET    /travel-requests/:id             Retrieve own request
 *   PATCH  /travel-requests/:id             Update own draft
 *   POST   /travel-requests/:id/submit      draft -> submitted
 *   POST   /travel-requests/:id/cancel      draft|submitted -> cancelled
 *   POST   /travel-requests/:id/days        Add a day to own draft
 *   PATCH  /travel-requests/:id/days/:dayId Update a day of own draft
 *   DELETE /travel-requests/:id/days/:dayId Delete a day of own draft
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './travel-requests.controller.js';

const router = Router();

router.use(authenticate, authorize('traveller'));

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.deleteRequest);
router.post('/:id/submit', controller.submit);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/days', controller.addDay);
router.patch('/:id/days/:dayId', controller.patchDay);
router.delete('/:id/days/:dayId', controller.deleteDay);

export default router;
