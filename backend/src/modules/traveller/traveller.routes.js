/**
 * Traveller profile routes (Phase 4).
 *
 *   GET   /travellers/me    Current traveller profile (+ identity)
 *   PATCH /travellers/me    Update own traveller profile
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './traveller.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('traveller'), controller.getMe);
router.patch('/me', authenticate, authorize('traveller'), controller.patchMe);
router.post('/me/profile-picture', authenticate, authorize('traveller'), controller.uploadProfilePicture);
router.delete('/me/profile-picture', authenticate, authorize('traveller'), controller.removeProfilePicture);
router.post('/me/avatar', authenticate, authorize('traveller'), controller.uploadProfilePicture);
router.delete('/me/avatar', authenticate, authorize('traveller'), controller.removeProfilePicture);
router.post('/me/cover-image', authenticate, authorize('traveller'), controller.uploadCoverImage);
router.delete('/me/cover-image', authenticate, authorize('traveller'), controller.removeCoverImage);

export default router;
