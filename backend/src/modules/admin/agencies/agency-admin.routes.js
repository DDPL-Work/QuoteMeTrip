import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import * as controller from './agency-admin.controller.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', controller.getAgencies);
router.get('/:id', controller.getAgency);
router.post('/:id/approve', controller.approveAgency);
router.post('/:id/reject', controller.rejectAgency);
router.post('/:id/suspend', controller.suspendAgency);
router.post('/:id/reactivate', controller.reactivateAgency);
router.post('/:id/documents/:documentId/verify', controller.verifyDocument);
router.post('/:id/documents/:documentId/reject', controller.rejectDocument);

export default router;
