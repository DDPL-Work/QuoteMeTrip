import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Phase 1: only the health check is mounted.
// Business modules (traveller, agency, admin, travel-request,
// quotation, messaging, etc.) will register their routers here
// in later phases.
router.use(healthRoutes);

export default router;
