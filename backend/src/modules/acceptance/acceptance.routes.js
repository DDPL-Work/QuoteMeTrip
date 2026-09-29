/**
 * Quotation acceptance routes (Phase 6).
 *
 *   POST /quotations/:id/accept   Traveller accepts own submitted quotation
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './acceptance.controller.js';

const router = Router();

router.post('/quotations/:id/accept', authenticate, authorize('traveller'), controller.accept);

export default router;
