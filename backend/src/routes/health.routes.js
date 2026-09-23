import { Router } from 'express';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (req, res) => {
  return successResponse(res, {
    service: 'troublefree-holiday-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
