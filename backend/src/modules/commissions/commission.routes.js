import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './commission.controller.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', controller.getCommissions);
router.get('/summary', controller.getCommissionSummary);
router.get('/:id', controller.getCommission);
router.patch('/:id/status', controller.updateCommissionStatus);

export default router;
