import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import travellerRoutes from '../modules/traveller/traveller.routes.js';
import routeRoutes from '../modules/routes/routes.routes.js';
import travelRequestRoutes from '../modules/travel-requests/travel-requests.routes.js';
import matchingRoutes from '../modules/agency-matching/matching.routes.js';
import {
  agencyQuotationRouter,
  travellerQuotationRouter,
} from '../modules/quotations/quotation.routes.js';
import messageRoutes from '../modules/messaging/message.routes.js';
import jobRoutes from '../modules/jobs/job.routes.js';
import acceptanceRoutes from '../modules/acceptance/acceptance.routes.js';
import agencyAdminRoutes from '../modules/admin/agencies/agency-admin.routes.js';
import {
  planRouter,
  membershipRouter,
  agencyMembershipRouter,
} from '../modules/admin/memberships/membership-admin.routes.js';
import commissionRoutes from '../modules/commissions/commission.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';
import {
  dashboardRouter,
  requestVisibilityRouter,
  jobVisibilityRouter,
} from '../modules/admin/operational/admin-operational.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { weatherRoutes } from '../modules/weather/weather.routes.js';
import { travelGuideAdminRoutes } from '../modules/travel-guide/travel-guide-admin.routes.js';
import { travelGuidePublicRoutes } from '../modules/travel-guide/travel-guide-public.routes.js';
import {
  ratingRoutes,
  agencyRatingRoutes,
  adminRatingRoutes,
} from '../modules/ratings/rating.routes.js';

const router = Router();

// Health check (Phase 1) plus authentication/identity (Phase 3).
// Traveller core workflow (Phase 4): profile, routes, travel requests.
// Agency matching + quotations (Phase 5): agency inbox, quotations.
// Messaging, acceptance & jobs (Phase 6): conversations, jobs.
// Admin operations (Phase 7): agency approval, memberships, commissions, audit, visibility.
router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/travellers', travellerRoutes);
router.use('/routes', routeRoutes);
router.use('/travel-requests', travelRequestRoutes);
router.use('/agency/travel-requests', matchingRoutes);
router.use('/agency', agencyQuotationRouter);
router.use('/', travellerQuotationRouter);
router.use('/conversations', messageRoutes);
router.use('/jobs', jobRoutes);
router.use('/', acceptanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/weather', weatherRoutes);
router.use('/travel-guide', travelGuidePublicRoutes);
router.use('/', ratingRoutes);
router.use('/agencies', agencyRatingRoutes);

// Admin routes
router.use('/admin/agencies', agencyAdminRoutes);
router.use('/admin/agencies', agencyMembershipRouter);
router.use('/admin/memberships', membershipRouter);
router.use('/admin/membership-plans', planRouter);
router.use('/admin/commissions', commissionRoutes);
router.use('/admin/audit-logs', auditRoutes);
router.use('/admin/travel-requests', requestVisibilityRouter);
router.use('/admin/jobs', jobVisibilityRouter);
router.use('/admin/travel-guide', travelGuideAdminRoutes);
router.use('/admin/ratings', adminRatingRoutes);
router.use('/admin', dashboardRouter);

export default router;
