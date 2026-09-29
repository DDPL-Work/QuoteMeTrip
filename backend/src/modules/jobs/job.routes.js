/**
 * Job routes (Phase 6).
 *
 *   GET   /jobs            Own jobs (traveller/agency; admin read-all)
 *   GET   /jobs/:id        Job detail (participants + admin)
 *   PATCH /jobs/:id/status Status transition (participants only)
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './job.controller.js';

const router = Router();

router.use(authenticate, authorize('traveller', 'agency', 'admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id/status', controller.updateStatus);

export default router;
