/**
 * Agency-matching routes (Phase 5).
 *
 *   GET  /agency/travel-requests        Matched inbox (paginated/filtered)
 *   GET  /agency/travel-requests/:id    Matched request detail (matched only)
 *   POST /agency/travel-requests/:id/view  Mark as viewed
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './matching.controller.js';

const router = Router();

router.use(authenticate, authorize('agency'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/:id/view', controller.view);

export default router;
