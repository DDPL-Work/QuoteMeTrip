/**
 * Authentication routes (Phase 3).
 *
 *   POST /auth/register/traveller   Traveller registration (auto-login)
 *   POST /auth/register/agency      Agency registration (auto-login)
 *   POST /auth/login                Email + password login
 *   POST /auth/google               Traveller Google login
 *   POST /auth/refresh              Rotate refresh session
 *   POST /auth/logout               Revoke current refresh session
 *   POST /auth/logout-all           Revoke all sessions (authenticated)
 *   GET  /auth/me                   Current identity (authenticated)
 *
 * There is intentionally NO public admin registration endpoint.
 */
import { Router } from 'express';
import * as controller from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createAuthRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Stricter limits on credential and token endpoints (configurable).
const sensitiveLimiter = createAuthRateLimiter();

router.post('/register/traveller', controller.registerTraveller);
router.post('/register/agency', controller.registerAgency);
router.post('/login', sensitiveLimiter, controller.login);
router.post('/google', sensitiveLimiter, controller.googleLogin);
router.post('/refresh', sensitiveLimiter, controller.refresh);
router.post('/logout', controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.get('/me', authenticate, controller.me);

export default router;
