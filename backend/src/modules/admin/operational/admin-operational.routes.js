import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import * as controller from './admin-operational.controller.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, authorize('admin'));
dashboardRouter.get('/dashboard', controller.getDashboardMetrics);
dashboardRouter.get('/metrics', controller.getDashboardMetrics);

export const requestVisibilityRouter = Router();
requestVisibilityRouter.use(authenticate, authorize('admin'));
requestVisibilityRouter.get('/', controller.getTravelRequests);
requestVisibilityRouter.get('/:id', controller.getTravelRequest);

export const jobVisibilityRouter = Router();
jobVisibilityRouter.use(authenticate, authorize('admin'));
jobVisibilityRouter.get('/', controller.getJobs);
jobVisibilityRouter.get('/:id', controller.getJob);
