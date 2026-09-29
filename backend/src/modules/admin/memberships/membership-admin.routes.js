import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import * as controller from './membership-admin.controller.js';

export const planRouter = Router();
planRouter.use(authenticate, authorize('admin'));
planRouter.get('/', controller.getMembershipPlans);
planRouter.post('/', controller.createMembershipPlan);
planRouter.patch('/:id', controller.updateMembershipPlan);

export const membershipRouter = Router();
membershipRouter.use(authenticate, authorize('admin'));
membershipRouter.get('/', controller.getMemberships);
membershipRouter.get('/:id', controller.getMembership);
membershipRouter.post('/:id/confirm-payment', controller.confirmPayment);
membershipRouter.post('/:id/suspend', controller.suspendMembership);
membershipRouter.post('/:id/reactivate', controller.reactivateMembership);
membershipRouter.patch('/:id', controller.updateMembership);

export const agencyMembershipRouter = Router();
agencyMembershipRouter.use(authenticate, authorize('admin'));
agencyMembershipRouter.post('/:agencyId/membership', controller.createAgencyMembership);
