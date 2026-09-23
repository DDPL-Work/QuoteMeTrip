import { Router } from 'express';
import { successResponse } from '../utils/apiResponse.js';
import { checkDatabaseHealth } from '../db/health.js';

const router = Router();

router.get('/health', async (req, res) => {
  // Phase 1 contract preserved: success/service/status/timestamp/
  // environment. Phase 2 extends it with a `database` probe so
  // callers can distinguish "app healthy" from "database available".
  const database = await checkDatabaseHealth();

  return successResponse(res, {
    service: 'troublefree-holiday-backend',
    status: database.status === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database,
  });
});

export default router;
