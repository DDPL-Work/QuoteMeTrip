import { initModels } from '../../../db/models/index.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../utils/errors.js';
import * as repository from './membership-admin.repository.js';
import { MEMBERSHIP_ADMIN_ERROR_CODES } from './membership-admin.constants.js';
import { logAudit } from '../../audit/audit.service.js';
import {
  emitNotificationEvent,
  NOTIFICATION_EVENTS,
} from '../../notifications/notification-events.js';

export async function listMembershipPlans() {
  return repository.findMembershipPlans();
}

export async function createMembershipPlan(data, actorUserId, context = {}) {
  let plan;
  await withTransaction(async (t) => {
    plan = await repository.createMembershipPlan(data, { transaction: t });
    await logAudit(
      {
        actorUserId,
        action: 'membership_plan.created',
        entityType: 'membership_plan',
        entityId: plan.id,
        afterState: plan.toJSON(),
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });
  return plan;
}

export async function updateMembershipPlan(id, data, actorUserId, context = {}) {
  let updated;
  await withTransaction(async (t) => {
    const plan = await repository.findMembershipPlanById(id, { transaction: t });
    if (!plan) {
      throw new NotFoundError('Membership plan not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.PLAN_NOT_FOUND,
      });
    }
    const beforeState = plan.toJSON();

    const allowed = ['name', 'slug', 'description', 'price', 'currency', 'durationDays', 'status'];
    const updateData = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    await plan.update(updateData, { transaction: t });
    updated = plan;

    await logAudit(
      {
        actorUserId,
        action: 'membership_plan.updated',
        entityType: 'membership_plan',
        entityId: plan.id,
        beforeState,
        afterState: plan.toJSON(),
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });
  return updated;
}

export async function deleteMembershipPlan(id, actorUserId, context = {}) {
  const models = initModels();
  await withTransaction(async (t) => {
    const plan = await repository.findMembershipPlanById(id, { transaction: t });
    if (!plan) {
      throw new NotFoundError('Membership plan not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.PLAN_NOT_FOUND,
      });
    }

    const assignedCount = await models.AgencyMembership.count({
      where: { planId: id },
      transaction: t,
    });
    if (assignedCount > 0) {
      const error = new Error(
        'Cannot delete membership plan because agencies are currently assigned to it. Deactivate the plan instead.',
      );
      error.status = 409;
      error.code = 'PLAN_IN_USE';
      throw error;
    }

    const beforeState = plan.toJSON();
    await repository.deleteMembershipPlan(id, { transaction: t });

    await logAudit(
      {
        actorUserId,
        action: 'membership_plan.deleted',
        entityType: 'membership_plan',
        entityId: id,
        beforeState,
        afterState: null,
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });
  return { success: true };
}

export async function listMemberships(query) {
  return repository.findMemberships(query);
}

export async function getMembershipById(id) {
  const membership = await repository.findMembershipById(id);
  if (!membership) {
    throw new NotFoundError('Agency membership not found.', {
      code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
    });
  }
  return membership;
}

export async function createAgencyMembership(
  agencyId,
  planId,
  input = {},
  actorUserId,
  context = {},
) {
  const models = initModels();
  let created;

  await withTransaction(async (t) => {
    const agency = await models.AgencyProfile.findByPk(agencyId, { transaction: t });
    if (!agency) {
      throw new NotFoundError('Agency profile not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
      });
    }
    const plan = await models.MembershipPlan.findByPk(planId, { transaction: t });
    if (!plan) {
      throw new NotFoundError('Membership plan not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.PLAN_NOT_FOUND,
      });
    }

    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const endsAt = input.endsAt
      ? new Date(input.endsAt)
      : new Date(startsAt.getTime() + (plan.durationDays || 30) * 86400000);

    const initialStatus = input.status || 'pending';
    const agreementAccepted = Boolean(input.agreementAccepted ?? true);

    created = await models.AgencyMembership.create(
      {
        agencyId,
        planId,
        startsAt,
        endsAt,
        status: initialStatus,
        paymentReference: input.paymentReference || null,
        notes: input.notes || null,
        agreementAccepted,
        agreementAcceptedAt: agreementAccepted ? new Date() : null,
        agreementVersion: input.agreementVersion || 'v1.0',
        confirmedBy: initialStatus === 'active' ? actorUserId : null,
        confirmedAt: initialStatus === 'active' ? new Date() : null,
      },
      { transaction: t },
    );

    // Also persist agreement status on agency profile if accepted
    if (agreementAccepted && !agency.agreementAccepted) {
      await agency.update(
        {
          agreementAccepted: true,
          agreementAcceptedAt: new Date(),
          agreementVersion: input.agreementVersion || 'v1.0',
        },
        { transaction: t },
      );
    }

    await logAudit(
      {
        actorUserId,
        action: 'membership.created',
        entityType: 'membership',
        entityId: created.id,
        afterState: created.toJSON(),
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  return repository.findMembershipById(created.id);
}

export async function confirmPayment(id, payload = {}, actorUserId, context = {}) {
  let updated;

  await withTransaction(async (t) => {
    const membership = await repository.findMembershipById(id, { transaction: t });
    if (!membership) {
      throw new NotFoundError('Agency membership not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
      });
    }

    const beforeState = membership.toJSON();
    const now = new Date();

    await membership.update(
      {
        status: 'active',
        confirmedBy: actorUserId,
        confirmedAt: now,
        paymentReference: payload.paymentReference || membership.paymentReference,
        notes: payload.notes || membership.notes,
        agreementAccepted: true,
        agreementAcceptedAt: membership.agreementAcceptedAt || now,
      },
      { transaction: t },
    );

    updated = membership;

    await logAudit(
      {
        actorUserId,
        action: 'payment.confirmed',
        entityType: 'membership',
        entityId: membership.id,
        beforeState: { status: beforeState.status, paymentReference: beforeState.paymentReference },
        afterState: {
          status: 'active',
          confirmedBy: actorUserId,
          confirmedAt: now,
          paymentReference: updated.paymentReference,
        },
        ipAddress: context.ip,
      },
      { transaction: t },
    );

    await logAudit(
      {
        actorUserId,
        action: 'membership.activated',
        entityType: 'membership',
        entityId: membership.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'active' },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.PAYMENT_CONFIRMED, {
    membershipId: id,
    agencyId: updated.agencyId,
  });
  emitNotificationEvent(NOTIFICATION_EVENTS.MEMBERSHIP_ACTIVATED, {
    membershipId: id,
    agencyId: updated.agencyId,
  });

  return repository.findMembershipById(updated.id);
}

export async function suspendMembership(id, actorUserId, context = {}) {
  let updated;

  await withTransaction(async (t) => {
    const membership = await repository.findMembershipById(id, { transaction: t });
    if (!membership) {
      throw new NotFoundError('Agency membership not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
      });
    }

    const beforeState = membership.toJSON();
    await membership.update({ status: 'suspended' }, { transaction: t });
    updated = membership;

    await logAudit(
      {
        actorUserId,
        action: 'membership.suspended',
        entityType: 'membership',
        entityId: membership.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'suspended' },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.MEMBERSHIP_SUSPENDED, {
    membershipId: id,
    agencyId: updated.agencyId,
  });

  return repository.findMembershipById(updated.id);
}

export async function reactivateMembership(id, actorUserId, context = {}) {
  let updated;

  await withTransaction(async (t) => {
    const membership = await repository.findMembershipById(id, { transaction: t });
    if (!membership) {
      throw new NotFoundError('Agency membership not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
      });
    }

    const beforeState = membership.toJSON();
    await membership.update({ status: 'active' }, { transaction: t });
    updated = membership;

    await logAudit(
      {
        actorUserId,
        action: 'membership.reactivated',
        entityType: 'membership',
        entityId: membership.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'active' },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.MEMBERSHIP_ACTIVATED, {
    membershipId: id,
    agencyId: updated.agencyId,
  });

  return repository.findMembershipById(updated.id);
}

export async function updateMembership(id, data, actorUserId, context = {}) {
  let updated;

  await withTransaction(async (t) => {
    const membership = await repository.findMembershipById(id, { transaction: t });
    if (!membership) {
      throw new NotFoundError('Agency membership not found.', {
        code: MEMBERSHIP_ADMIN_ERROR_CODES.NOT_FOUND,
      });
    }

    const beforeState = membership.toJSON();
    await membership.update(data, { transaction: t });
    updated = membership;

    await logAudit(
      {
        actorUserId,
        action: 'membership.updated',
        entityType: 'membership',
        entityId: membership.id,
        beforeState,
        afterState: membership.toJSON(),
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  return repository.findMembershipById(updated.id);
}
