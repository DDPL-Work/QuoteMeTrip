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

/** Server-side totals: Σ(quantity × unit_price), taxes, rounded to cents. */
export function calculateTotals(items, { taxRate = 0 } = {}) {
  const lines = items.map((item) => ({
    ...item,
    lineTotal: Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) / 100,
  }));
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  const rate = Number(taxRate) || 0;
  const taxAmount = rate > 0 ? Math.round(subtotal * (rate / 100) * 100) / 100 : 0;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { lines, subtotal, taxRate: rate, taxAmount, total };
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
    const request = await assertRequestQuotable(models, travelRequestId, { transaction: t });

    // Multi-quotation support: Determine version and parent quotation
    const prevQuotes = await models.Quotation.findAll({
      where: { travelRequestId, agencyId: agency.id },
      order: [
        [models.sequelize.col('Quotation.version'), 'DESC'],
        [models.sequelize.col('Quotation.id'), 'DESC'],
      ],
      transaction: t,
    });
    const version = prevQuotes.length > 0 ? (Number(prevQuotes[0].version) || prevQuotes.length) + 1 : 1;
    const parentQuotationId = input.parentQuotationId || (prevQuotes.length > 0 ? prevQuotes[0].id : null);

    // Package-aware quotation item validation
    if (request?.packageType === 'hotel_only') {
      const hasHotel = (input.items || []).some((it) => it.itemType === 'hotel');
      if (!hasHotel) {
        throw new ValidationError('A hotel-only request quotation must include at least one hotel accommodation item.', {
          code: QUOTATION_ERROR_CODES.VALIDATION_ERROR,
        });
      }
    } else if (request?.packageType === 'vehicle_driver') {
      const hasTransport = (input.items || []).some((it) => ['vehicle', 'driver'].includes(it.itemType));
      if (!hasTransport) {
        throw new ValidationError('A vehicle & driver request quotation must include at least one vehicle or driver transport item.', {
          code: QUOTATION_ERROR_CODES.VALIDATION_ERROR,
        });
      }
    }

    const { subtotal } = calculateTotals(input.items);
    const taxRate = input.taxRate || 0;
    const taxAmount = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const branding = input.branding || {
      agencyName: agency.agencyName || null,
      logoUrl: agency.logoPath || null,
      phone: agency.phone || null,
      email: agency.businessEmail || null,
      address: [agency.address, agency.city, agency.country].filter(Boolean).join(', ') || null,
    };

    const quotation = await models.Quotation.create(
      {
        travelRequestId,
        agencyId: agency.id,
        status: 'draft',
        version,
        parentQuotationId,
        quotationType: input.quotationType,
        currency: input.currency ?? 'USD',
        subtotal,
        taxRate,
        taxAmount,
        taxLabel: input.taxLabel ?? null,
        totalAmount: total,
        validUntil: input.validUntil ?? null,
        notes: input.notes ?? null,
        greeting: input.greeting ?? null,
        packageOverview: input.packageOverview ?? null,
        itineraryDays: input.itineraryDays ?? [],
        paymentDetails: input.paymentDetails ?? null,
        inclusions: input.inclusions ?? [],
        exclusions: input.exclusions ?? [],
        termsSections: input.termsSections ?? [],
        branding,
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
        metadata: line.metadata ?? null,
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
    if (patch.taxRate !== undefined) {
      updatable.taxRate = patch.taxRate;
    }
    if (patch.taxLabel !== undefined) {
      updatable.taxLabel = patch.taxLabel;
    }
    if (patch.greeting !== undefined) {
      updatable.greeting = patch.greeting;
    }
    if (patch.packageOverview !== undefined) {
      updatable.packageOverview = patch.packageOverview;
    }
    if (patch.itineraryDays !== undefined) {
      updatable.itineraryDays = patch.itineraryDays;
    }
    if (patch.paymentDetails !== undefined) {
      updatable.paymentDetails = patch.paymentDetails;
    }
    if (patch.inclusions !== undefined) {
      updatable.inclusions = patch.inclusions;
    }
    if (patch.exclusions !== undefined) {
      updatable.exclusions = patch.exclusions;
    }
    if (patch.termsSections !== undefined) {
      updatable.termsSections = patch.termsSections;
    }
    if (patch.branding !== undefined) {
      updatable.branding = patch.branding;
    }

    const currentTaxRate = patch.taxRate !== undefined ? patch.taxRate : Number(quotation.taxRate || 0);

    if (patch.items !== undefined) {
      const { subtotal, taxAmount, total, lines } = calculateTotals(patch.items, {
        taxRate: currentTaxRate,
      });
      updatable.subtotal = subtotal;
      updatable.taxAmount = taxAmount;
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
          metadata: line.metadata ?? null,
        })),
        { transaction: t },
      );
    } else if (patch.taxRate !== undefined) {
      const existingItems = await models.QuotationItem.findAll({
        where: { quotationId: quotation.id },
        transaction: t,
      });
      const { subtotal, taxAmount, total } = calculateTotals(existingItems, {
        taxRate: currentTaxRate,
      });
      updatable.subtotal = subtotal;
      updatable.taxAmount = taxAmount;
      updatable.totalAmount = total;
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
    const currentTaxRate = Number(quotation.taxRate || 0);
    const { subtotal, taxAmount, total } = calculateTotals(
      lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
      { taxRate: currentTaxRate },
    );
    await quotation.update(
      {
        status: 'submitted',
        subtotal,
        taxAmount,
        totalAmount: total,
        submittedAt: new Date(),
      },
      { transaction: t },
    );
    await markMatchQuoted(models, quotation.travelRequestId, agency.id, { transaction: t });

    // Transition request status to 'quoted' if currently 'submitted' or 'matching'
    const request = await models.TravelRequest.findByPk(quotation.travelRequestId, {
      transaction: t,
    });
    if (request && ['submitted', 'matching'].includes(request.status)) {
      await request.update({ status: 'quoted' }, { transaction: t });
    }

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
    order: [[models.sequelize.col('Quotation.created_at'), 'DESC']],
  });
  const revealed = await isContactRevealedForRequest(travelRequestId, { registry: models });

  // Attach rating summaries to agency objects
  const { ratingService } = await import('../ratings/rating.service.js');
  const agencyRatings = {};
  for (const q of rows) {
    if (q.agencyId && agencyRatings[q.agencyId] === undefined) {
      try {
        agencyRatings[q.agencyId] = await ratingService.getAgencyRatingSummary(q.agencyId);
      } catch {
        agencyRatings[q.agencyId] = null;
      }
    }
  }

  return rows.map((q) => {
    const ag = q.agency
      ? { ...(q.agency.toJSON ? q.agency.toJSON() : q.agency), ratingSummary: agencyRatings[q.agencyId] || null }
      : null;
    return toPublicQuotation(q, { agency: ag, revealed });
  });
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
