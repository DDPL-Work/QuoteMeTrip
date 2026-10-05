import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './agency-profile.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('agency'));

router.get('/profile', controller.getProfile);
router.get('/coverage', controller.getCoverage);
router.put('/coverage', controller.updateCoverage);
router.patch('/coverage', controller.updateCoverage);

router.get('/onboarding-status', controller.getOnboardingStatus);
router.get('/documents', controller.getDocuments);
router.post('/documents', controller.uploadDocument);
router.delete('/documents/:documentId', controller.deleteDocument);
router.post('/agreement', controller.acceptAgreement);
router.post('/onboarding/submit', controller.submitOnboarding);

export default router;
