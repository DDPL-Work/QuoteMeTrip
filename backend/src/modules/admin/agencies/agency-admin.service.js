import { initModels } from '../../../db/models/index.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../utils/errors.js';
import * as repository from './agency-admin.repository.js';
import { AGENCY_ADMIN_ERROR_CODES } from './agency-admin.constants.js';
import { logAudit } from '../../audit/audit.service.js';
import {
  emitNotificationEvent,
  NOTIFICATION_EVENTS,
} from '../../notifications/notification-events.js';

export async function listAgencies(query) {
  return repository.findAgencies(query);
}

export async function getAgencyById(id) {
  const agency = await repository.findAgencyById(id);
  if (!agency) {
    throw new NotFoundError('Agency not found.', { code: AGENCY_ADMIN_ERROR_CODES.NOT_FOUND });
  }
  return agency;
}

export async function approveAgency(id, actorUserId, context = {}) {
  let beforeState;
  let updatedAgency;

  await withTransaction(async (t) => {
    const agency = await repository.findAgencyById(id, { transaction: t });
    if (!agency) {
      throw new NotFoundError('Agency not found.', { code: AGENCY_ADMIN_ERROR_CODES.NOT_FOUND });
    }
    beforeState = agency.toJSON();
    await agency.update({ status: 'approved' }, { transaction: t });
    updatedAgency = agency;

    await logAudit(
      {
        actorUserId,
        action: 'agency.approved',
        entityType: 'agency',
        entityId: agency.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'approved' },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.AGENCY_APPROVED, { agencyId: id });
  return updatedAgency;
}

export async function rejectAgency(id, reason = null, actorUserId, context = {}) {
  let beforeState;
  let updatedAgency;

  await withTransaction(async (t) => {
    const agency = await repository.findAgencyById(id, { transaction: t });
    if (!agency) {
      throw new NotFoundError('Agency not found.', { code: AGENCY_ADMIN_ERROR_CODES.NOT_FOUND });
    }
    beforeState = agency.toJSON();
    await agency.update({ status: 'rejected' }, { transaction: t });
    updatedAgency = agency;

    await logAudit(
      {
        actorUserId,
        action: 'agency.rejected',
        entityType: 'agency',
        entityId: agency.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'rejected', reason },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.AGENCY_REJECTED, { agencyId: id, reason });
  return updatedAgency;
}

export async function suspendAgency(id, reason = null, actorUserId, context = {}) {
  let beforeState;
  let updatedAgency;

  await withTransaction(async (t) => {
    const agency = await repository.findAgencyById(id, { transaction: t });
    if (!agency) {
      throw new NotFoundError('Agency not found.', { code: AGENCY_ADMIN_ERROR_CODES.NOT_FOUND });
    }
    beforeState = agency.toJSON();
    await agency.update({ status: 'suspended' }, { transaction: t });
    updatedAgency = agency;

    await logAudit(
      {
        actorUserId,
        action: 'agency.suspended',
        entityType: 'agency',
        entityId: agency.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'suspended', reason },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.AGENCY_SUSPENDED, { agencyId: id, reason });
  return updatedAgency;
}

export async function reactivateAgency(id, actorUserId, context = {}) {
  let beforeState;
  let updatedAgency;

  await withTransaction(async (t) => {
    const agency = await repository.findAgencyById(id, { transaction: t });
    if (!agency) {
      throw new NotFoundError('Agency not found.', { code: AGENCY_ADMIN_ERROR_CODES.NOT_FOUND });
    }
    beforeState = agency.toJSON();
    await agency.update({ status: 'approved' }, { transaction: t });
    updatedAgency = agency;

    await logAudit(
      {
        actorUserId,
        action: 'agency.reactivated',
        entityType: 'agency',
        entityId: agency.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'approved' },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.AGENCY_REACTIVATED, { agencyId: id });
  return updatedAgency;
}

export async function verifyDocument(agencyId, documentId, actorUserId, context = {}) {
  const models = initModels();
  let updatedDoc;

  await withTransaction(async (t) => {
    const doc = await models.AgencyDocument.findOne({
      where: { id: documentId, agencyId },
      transaction: t,
    });
    if (!doc) {
      throw new NotFoundError('Agency document not found.', {
        code: AGENCY_ADMIN_ERROR_CODES.DOCUMENT_NOT_FOUND,
      });
    }

    const beforeState = doc.toJSON();
    await doc.update(
      {
        status: 'approved',
        verifiedBy: actorUserId,
        verifiedAt: new Date(),
      },
      { transaction: t },
    );
    updatedDoc = doc;

    await logAudit(
      {
        actorUserId,
        action: 'document.verified',
        entityType: 'document',
        entityId: doc.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'approved', verifiedBy: actorUserId },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.DOCUMENT_VERIFIED, { agencyId, documentId });
  return updatedDoc;
}

export async function rejectDocument(agencyId, documentId, note = null, actorUserId, context = {}) {
  const models = initModels();
  let updatedDoc;

  await withTransaction(async (t) => {
    const doc = await models.AgencyDocument.findOne({
      where: { id: documentId, agencyId },
      transaction: t,
    });
    if (!doc) {
      throw new NotFoundError('Agency document not found.', {
        code: AGENCY_ADMIN_ERROR_CODES.DOCUMENT_NOT_FOUND,
      });
    }

    const beforeState = doc.toJSON();
    await doc.update(
      {
        status: 'rejected',
        verifiedBy: actorUserId,
        verifiedAt: new Date(),
        verificationNote: note,
      },
      { transaction: t },
    );
    updatedDoc = doc;

    await logAudit(
      {
        actorUserId,
        action: 'document.rejected',
        entityType: 'document',
        entityId: doc.id,
        beforeState: { status: beforeState.status },
        afterState: { status: 'rejected', verificationNote: note },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.DOCUMENT_REJECTED, { agencyId, documentId, note });
  return updatedDoc;
}
