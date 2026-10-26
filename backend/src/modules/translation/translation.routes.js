/**
 * Translation Routes.
 * Mounted at `/api/v1/translations`.
 */
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createTranslationRateLimiter,
  createTransientTranslationRateLimiter,
} from '../../middleware/rateLimiter.js';
import {
  translateContent,
  translateBatch,
  translateTransient,
  getStats,
} from './translation.controller.js';

const router = Router();

const contentLimiter = createTranslationRateLimiter();
const transientLimiter = createTransientTranslationRateLimiter();

// Single content field translation (public or authorized private)
router.post('/content', contentLimiter, optionalAuthenticate, translateContent);

// Batch content fields translation (public or authorized private)
router.post('/batch', contentLimiter, optionalAuthenticate, translateBatch);

// Transient ad-hoc text translation (authenticated users, strictly rate-limited)
router.post('/transient', transientLimiter, authenticate, translateTransient);

// Admin-only observability & usage metrics
router.get('/stats', authenticate, authorize('admin'), getStats);

export default router;
