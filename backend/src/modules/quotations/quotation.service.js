/**
 * Quotation service (Phase 5).
 *
 * Totals are always server-calculated: per-line
 * `quantity × unit_price`, subtotal = Σ lines, total = subtotal
 * (no taxes/discounts defined in Phase 5 — none are invented).
 * Creation and submission run inside `withTransaction()`.
 */
import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { QUOTATION_TRANSITIONS } from '../../db/models/Quotation.js';
import * as repository from './quotation.repository.js';
import { toPublicQuotation } from './quotation.mapper.js';
import { QUOTATION_ERROR_CODES, ACTIVE_QUOTATION_STATUSES } from './quotation.constants.js';
import { isContactRevealedForRequest } from '../contact/contact-visibility.js';
import {
  NOTIFICATION_EVENTS,
  emitNotificationEvent,
} from '../notifications/notification-events.js';

function assertAgency(role) {
  if (role && role !== 'agency') {
    throw new ForbiddenError('Only agencies can manage quotations.', {
      code: QUOTATION_ERROR_CODES.FORBIDDEN,
    });
  }
}

function assertTraveller(role) {
  if (role && role !== 'traveller') {
    throw new ForbiddenError('Only travellers can view these quotations.', {
      code: QUOTATION_ERROR_CODES.FORBIDDEN,
    });
  }
}

async function resolveAgency(models, userId, { transaction = null } = {}) {
  const agency = await models.AgencyProfile.findOne({ where: { userId }, transaction });
  if (!agency) {
    throw new NotFoundError('Agency profile not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  return agency;
}

/** Active agency gate: suspended/inactive agencies cannot quote. */
async function assertAgencyCanQuote(models, agency, { transaction = null } = {}) {
  if (agency.status !== 'approved') {
    throw new ForbiddenError('Your agency account is not approved to send quotations.', {
      code: QUOTATION_ERROR_CODES.FORBIDDEN,
    });
  }
  const user = await models.User.findByPk(agency.userId, { transaction });
  if (!user || user.status !== 'active') {
    throw new ForbiddenError('Your account cannot send quotations.', {
      code: QUOTATION_ERROR_CODES.FORBIDDEN,
    });
  }
}

async function findMatchOrThrow(models, travelRequestId, agencyId, { transaction = null } = {}) {
  const match = await models.TravelRequestAgency.findOne({
    where: { travelRequestId, agencyId },
    transaction,
  });
  if (!match) {
    // 404 by design: an unmatched agency must not learn whether the
    // request exists.
    throw new NotFoundError('Travel request not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  return match;
}

/**
 * Phase 6: quotations can only be created/submitted while the request
 * is still shopping (submitted/matching/quoted). Accepted/cancelled/
 * draft requests reject new quotation work.
 */
async function assertRequestQuotable(models, travelRequestId, { transaction = null } = {}) {
  const request = await models.TravelRequest.findByPk(travelRequestId, { transaction });
  if (!request || !['submitted', 'matching', 'quoted'].includes(request.status)) {
    throw new ValidationError('This request is not accepting quotations.', {
      code: QUOTATION_ERROR_CODES.INVALID_TRANSITION,
    });
  }
  return request;
}

async function loadQuotation(models, quotationId, { transaction = null } = {}) {
  const quotation = await repository.findQuotationById(quotationId, { transaction });
  if (!quotation) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  return quotation;
}

/** Server-side totals: Σ(quantity × unit_price), rounded to cents. */
export function calculateTotals(items) {
  const lines = items.map((item) => ({
    ...item,
    lineTotal: Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) / 100,
  }));
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  return { lines, subtotal, total: subtotal };
}

function assertTransition(from, to) {
  const allowed = QUOTATION_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    const error = new ValidationError(`Cannot move a quotation from "${from}" to "${to}".`, {
      code: QUOTATION_ERROR_CODES.INVALID_TRANSITION,
    });
    error.statusCode = 400;
    throw error;
  }
}

async function markMatchQuoted(models, travelRequestId, agencyId, { transaction = null } = {}) {
  const match = await models.TravelRequestAgency.findOne({
    where: { travelRequestId, agencyId },
    transaction,
  });
  if (match && match.matchStatus !== 'quoted') {
    await match.update({ matchStatus: 'quoted', respondedAt: new Date() }, { transaction });
  }
}

/* ------------------------------------------------------------------ */
/* Agency operations                                                   */
/* ------------------------------------------------------------------ */

export async function createQuotation(userId, travelRequestId, input, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const createdId = await withTransaction(async (t) => {
    const agency = await resolveAgency(models, userId, { transaction: t });
    await assertAgencyCanQuote(models, agency, { transaction: t });
    await findMatchOrThrow(models, travelRequestId, agency.id, { transaction: t });
    await assertRequestQuotable(models, travelRequestId, { transaction: t });

    const active = await repository.findActiveQuotation(travelRequestId, agency.id, {
      transaction: t,
    });
    if (active) {
      const error = new ValidationError(
        'An active quotation already exists for this request. Edit or withdraw it first.',
        { code: QUOTATION_ERROR_CODES.DUPLICATE },
      );
      error.statusCode = 409;
      throw error;
    }

    const { subtotal, total } = calculateTotals(input.items);
    const quotation = await models.Quotation.create(
      {
        travelRequestId,
        agencyId: agency.id,
        status: 'draft',
        quotationType: input.quotationType,
        currency: input.currency ?? 'USD',
        subtotal,
        totalAmount: total,
        validUntil: input.validUntil ?? null,
        notes: input.notes ?? null,
      },
      { transaction: t },
    );
    await models.QuotationItem.bulkCreate(
      calculateTotals(input.items).lines.map((line) => ({
        quotationId: quotation.id,
        itemType: line.itemType,
        title: line.title,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.lineTotal,
      })),
      { transaction: t },
    );
    return quotation.id;
  });

  const quotation = await loadQuotation(models, createdId);
  return toPublicQuotation(quotation);
}

export async function listAgencyQuotations(userId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const rows = await models.Quotation.findAll({
    where: { agencyId: agency.id },
    include: [{ model: models.QuotationItem, as: 'items' }],
    order: [[models.sequelize.col('Quotation.updated_at'), 'DESC']],
  });
  return rows.map((q) => toPublicQuotation(q));
}

export async function getAgencyQuotation(userId, quotationId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const quotation = await loadQuotation(models, quotationId);
  if (quotation.agencyId !== agency.id) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  return toPublicQuotation(quotation);
}

function assertDraft(quotation) {
  if (quotation.status !== 'draft') {
    throw new ValidationError('Only draft quotations can be edited.', {
      code: QUOTATION_ERROR_CODES.INVALID_TRANSITION,
    });
  }
}

export async function patchQuotation(userId, quotationId, patch, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const quotation = await loadQuotation(models, quotationId);
  if (quotation.agencyId !== agency.id) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  assertDraft(quotation);

  await withTransaction(async (t) => {
    const updatable = {};
    if (patch.quotationType !== undefined) {
      updatable.quotationType = patch.quotationType;
    }
    if (patch.currency !== undefined) {
      updatable.currency = patch.currency;
    }
    if (patch.validUntil !== undefined) {
      updatable.validUntil = patch.validUntil;
    }
    if (patch.notes !== undefined) {
      updatable.notes = patch.notes;
    }
    if (patch.items !== undefined) {
      const { subtotal, total, lines } = calculateTotals(patch.items);
      updatable.subtotal = subtotal;
      updatable.totalAmount = total;
      await models.QuotationItem.destroy({ where: { quotationId: quotation.id }, transaction: t });
      await models.QuotationItem.bulkCreate(
        lines.map((line) => ({
          quotationId: quotation.id,
          itemType: line.itemType,
          title: line.title,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.lineTotal,
        })),
        { transaction: t },
      );
    }
    if (Object.keys(updatable).length > 0) {
      await quotation.update(updatable, { transaction: t });
    }
  });

  return toPublicQuotation(await loadQuotation(models, quotationId));
}

export async function submitQuotation(userId, quotationId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  let submittedId = null;
  await withTransaction(async (t) => {
    const agency = await resolveAgency(models, userId, { transaction: t });
    await assertAgencyCanQuote(models, agency, { transaction: t });
    const quotation = await loadQuotation(models, quotationId, { transaction: t });
    if (quotation.agencyId !== agency.id) {
      throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
    }
    assertTransition(quotation.status, 'submitted');
    await findMatchOrThrow(models, quotation.travelRequestId, agency.id, { transaction: t });
    await assertRequestQuotable(models, quotation.travelRequestId, { transaction: t });

    // Recalculate from stored lines — never trust stored totals blindly.
    const lines = await models.QuotationItem.findAll({
      where: { quotationId: quotation.id },
      transaction: t,
    });
    if (lines.length === 0) {
      throw new ValidationError('A quotation needs at least one item before submitting.', {
        code: QUOTATION_ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const { subtotal, total } = calculateTotals(
      lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
    );
    await quotation.update(
      { status: 'submitted', subtotal, totalAmount: total, submittedAt: new Date() },
      { transaction: t },
    );
    await markMatchQuoted(models, quotation.travelRequestId, agency.id, { transaction: t });
    submittedId = quotation.id;
  });

  const quotation = await loadQuotation(models, submittedId);
  emitNotificationEvent(NOTIFICATION_EVENTS.QUOTATION_SUBMITTED, {
    quotationId: quotation.id,
    travelRequestId: quotation.travelRequestId,
    agencyId: quotation.agencyId,
  });
  return toPublicQuotation(quotation);
}

export async function withdrawQuotation(userId, quotationId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const quotation = await loadQuotation(models, quotationId);
  if (quotation.agencyId !== agency.id) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  assertTransition(quotation.status, 'withdrawn');
  await quotation.update({ status: 'withdrawn' });
  return toPublicQuotation(await loadQuotation(models, quotationId));
}

/* ------------------------------------------------------------------ */
/* Traveller operations                                                */
/* ------------------------------------------------------------------ */

export async function listRequestQuotations(userId, travelRequestId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const request = await models.TravelRequest.findByPk(travelRequestId);
  if (!request || request.travellerId !== Number(userId)) {
    throw new NotFoundError('Travel request not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  const rows = await models.Quotation.findAll({
    where: { travelRequestId, status: ['submitted', 'accepted', 'rejected'] },
    include: [
      { model: models.QuotationItem, as: 'items' },
      { model: models.AgencyProfile, as: 'agency' },
    ],
    order: [[models.sequelize.col('Quotation.updated_at'), 'DESC']],
  });
  const revealed = await isContactRevealedForRequest(travelRequestId, { registry: models });
  return rows.map((q) => toPublicQuotation(q, { agency: q.agency, revealed }));
}

export async function getQuotationForTraveller(userId, quotationId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const quotation = await models.Quotation.findByPk(quotationId, {
    include: [
      { model: models.QuotationItem, as: 'items' },
      { model: models.AgencyProfile, as: 'agency' },
    ],
  });
  if (!quotation) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  const request = await models.TravelRequest.findByPk(quotation.travelRequestId);
  if (!request || request.travellerId !== Number(userId)) {
    throw new NotFoundError('Quotation not found.', { code: QUOTATION_ERROR_CODES.NOT_FOUND });
  }
  const revealed = await isContactRevealedForRequest(request.id, { registry: models });
  return toPublicQuotation(quotation, { agency: quotation.agency, revealed });
}

export { ACTIVE_QUOTATION_STATUSES };
