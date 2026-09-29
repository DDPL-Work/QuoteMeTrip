import { Router } from 'express';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { checkDatabaseHealth } from '../db/health.js';

const router = Router();

// GET /api/v1/health (Baseline Health Check - preserved for Phase 1-8 compatibility)
router.get('/health', async (req, res) => {
  const database = await checkDatabaseHealth();

  return successResponse(res, {
    service: 'troublefree-holiday-backend',
    status: database.status === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database,
  });
});

// GET /api/v1/health/liveness (Liveness probe - confirms process is up)
router.get('/health/liveness', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/health/readiness (Readiness probe - verifies DB connectivity & core dependencies)
router.get('/health/readiness', async (req, res) => {
  const database = await checkDatabaseHealth();
  const isReady = database.status === 'connected';

  const optionalProviders = {
    weather: Boolean(process.env.WEATHER_API_KEY),
    googleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
    email: Boolean(process.env.SMTP_HOST),
    sms: Boolean(process.env.SMS_API_KEY),
    firebase: Boolean(process.env.FIREBASE_PROJECT_ID),
  };

  if (!isReady) {
    return errorResponse(res, {
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database connection failed. Application is not ready.',
      details: { database, optionalProviders },
    });
  }

  return successResponse(res, {
    status: 'ready',
    timestamp: new Date().toISOString(),
    database,
    optionalProviders,
  });
});

export default router;
