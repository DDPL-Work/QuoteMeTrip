/**
 * Quotation acceptance service (Phase 6).
 *
 * One transaction: validate → quotation accepted → request accepted →
 * job created → rival submitted quotations rejected → commit, then
 * post-commit events. Any failure rolls back everything.
 */
import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { toPublicQuotation } from '../quotations/quotation.mapper.js';
import { toPublicJob, jobTravellerSnippet, jobAgencySnippet } from '../jobs/job.mapper.js';
import { getAgencyContact } from '../contact/contact-visibility.js';

function acceptError(message, code, statusCode = 400) {
  const error = new ValidationError(message, { code });
  error.statusCode = statusCode;
  return error;
}

export async function acceptQuotation(userId, quotationId, { role = null } = {}) {
  if (role && role !== 'traveller') {
    throw new ForbiddenError('Only travellers can accept quotations.', {
      code: 'QUOTATION_FORBIDDEN',
    });
  }
  const models = initModels();

  // Idempotent fast path: already accepted → return current state.
  const existing = await models.Quotation.findByPk(quotationId, {
    include: [{ model: models.QuotationItem, as: 'items' }],
  });
  if (!existing) {
    throw new NotFoundError('Quotation not found.', { code: 'QUOTATION_NOT_FOUND' });
  }
  const existingRequest = await models.TravelRequest.findByPk(existing.travelRequestId);
  if (!existingRequest || existingRequest.travellerId !== Number(userId)) {
    throw new NotFoundError('Quotation not found.', { code: 'QUOTATION_NOT_FOUND' });
  }
  if (existing.status === 'accepted') {
    const job = await models.Job.findOne({
      where: { travelRequestId: existing.travelRequestId, quotationId: existing.id },
    });
    return toAcceptedPayload(models, existing, existingRequest, job);
  }

  const outcome = await withTransaction(async (t) => {
    const quotation = await models.Quotation.findByPk(quotationId, {
      include: [{ model: models.QuotationItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!quotation) {
      throw new NotFoundError('Quotation not found.', { code: 'QUOTATION_NOT_FOUND' });
    }
    const request = await models.TravelRequest.findByPk(quotation.travelRequestId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!request || request.travellerId !== Number(userId)) {
      throw new NotFoundError('Quotation not found.', { code: 'QUOTATION_NOT_FOUND' });
    }
    if (quotation.status !== 'submitted') {
      throw acceptError(
        'Only submitted quotations can be accepted.',
        'QUOTATION_INVALID_TRANSITION',
      );
    }
    if (request.status === 'accepted') {
      throw acceptError(
        'This request already has an accepted quotation.',
        'QUOTATION_ALREADY_ACCEPTED',
        409,
      );
    }
    if (!['submitted', 'quoted'].includes(request.status)) {
      throw acceptError(
        'This request cannot accept quotations in its current state.',
        'QUOTATION_INVALID_TRANSITION',
      );
    }

    const now = new Date();
    await quotation.update({ status: 'accepted' }, { transaction: t });
    await request.update({ status: 'accepted' }, { transaction: t });

    const job = await models.Job.create(
      {
        travelRequestId: request.id,
        quotationId: quotation.id,
        travellerId: request.travellerId,
        agencyId: quotation.agencyId,
        status: 'accepted',
        acceptedAt: now,
      },
      { transaction: t },
    );

    const { createCommissionForJob } = await import('../commissions/commission.service.js');
    await createCommissionForJob(job.id, { transaction: t });

    // Rival submitted quotations are rejected; drafts stay untouched
    // but can no longer be submitted (request is no longer submitted).
    await models.Quotation.update(
      { status: 'rejected' },
      {
        where: {
          travelRequestId: request.id,
          status: 'submitted',
        },
        transaction: t,
      },
    );
    // Re-fetch: the bulk update above also matched nothing else, but
    // re-read the accepted row for a clean payload.
    const refreshed = await models.Quotation.findByPk(quotation.id, {
      include: [{ model: models.QuotationItem, as: 'items' }],
      transaction: t,
    });
    return { quotation: refreshed, request, job };
  });

  const { quotation, request, job } = outcome;
  const { emitNotificationEvent, NOTIFICATION_EVENTS } =
    await import('../notifications/notification-events.js');
  emitNotificationEvent(NOTIFICATION_EVENTS.QUOTATION_ACCEPTED, {
    quotationId: quotation.id,
    travelRequestId: request.id,
    agencyId: quotation.agencyId,
  });
  emitNotificationEvent(NOTIFICATION_EVENTS.JOB_CREATED, {
    jobId: job.id,
    quotationId: quotation.id,
    travelRequestId: request.id,
  });
  emitNotificationEvent(NOTIFICATION_EVENTS.CONTACT_REVEALED, {
    travelRequestId: request.id,
    quotationId: quotation.id,
  });

  return toAcceptedPayload(models, quotation, request, job);
}

async function toAcceptedPayload(models, quotation, request, job) {
  const agency = await models.AgencyProfile.findByPk(quotation.agencyId);
  const user = await models.User.findByPk(request.travellerId);
  const profile = await models.TravellerProfile.findOne({ where: { userId: request.travellerId } });
  const publicQuotation = toPublicQuotation(quotation, { agency });
  // Acceptance reveals contact: override the snippet with full fields.
  publicQuotation.agency = { id: agency.id, ...getAgencyContact(agency, { revealed: true }) };
  const publicJob = job
    ? toPublicJob(job, {
        revealed: true,
        traveller: jobTravellerSnippet(user, profile, { revealed: true }),
        agency: jobAgencySnippet(agency, { revealed: true }),
      })
    : null;
  return { quotation: publicQuotation, job: publicJob, requestStatus: request.status };
}
