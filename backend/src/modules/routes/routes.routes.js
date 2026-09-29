/**
 * Route routes (Phase 4).
 *
 *   POST   /routes/calculate   Calculate without persisting
 *   POST   /routes             Calculate + persist (traveller-owned)
 *   GET    /routes/:id         Retrieve own route
 *   PATCH  /routes/:id         Update own route
 *   DELETE /routes/:id         Delete own route (unless referenced)
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './routes.controller.js';

const router = Router();

router.post('/calculate', authenticate, authorize('traveller'), controller.calculate);
router.post('/', authenticate, authorize('traveller'), controller.create);
router.get('/:id', authenticate, authorize('traveller'), controller.getById);
router.patch('/:id', authenticate, authorize('traveller'), controller.patch);
router.delete('/:id', authenticate, authorize('traveller'), controller.remove);

export default router;
