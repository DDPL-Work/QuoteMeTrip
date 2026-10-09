/**
 * Travel-request service (Phase 4).
 *
 * Draft-first workflow with transactional creation:
 *   route creation + route stops + request + days
 * commit together or roll back together via `withTransaction()`.
 * Ownership is enforced on every operation.
 */
import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { TRAVEL_REQUEST_TRANSITIONS } from '../../db/models/TravelRequest.js';
import { calculateRouteForTraveller, toPublicRoute } from '../routes/routes.service.js';
import {
  matchAgenciesForRequest,
  emitRequestMatchedEvents,
} from '../agency-matching/matching.service.js';
import { validateDayInput } from './travel-requests.validation.js';
import { toPublicQuotation } from '../quotations/quotation.mapper.js';
import { toPublicJob, jobAgencySnippet } from '../jobs/job.mapper.js';
import { isContactRevealedForRequest, getTravellerContact } from '../contact/contact-visibility.js';

function assertTraveller(role) {
  if (role && role !== 'traveller') {
    throw new ForbiddenError('Only travellers can manage travel requests.', {
      code: 'AUTH_FORBIDDEN',
    });
  }
}

function toPublicDay(day) {
  return {
    id: day.id,
    dayNumber: day.dayNumber,
    date: day.date,
    location: day.location,
    title: day.title,
    description: day.description,
    hotelNotes: day.hotelNotes,
    guideNotes: day.guideNotes,
    driverNotes: day.driverNotes,
    specialRequirements: day.specialRequirements,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
  };
}

export function resolveRequestTitle(request) {
  if (!request) return 'Travel Request';
  if (request.title && typeof request.title === 'string' && request.title.trim() && !/^Request\s*#?\d+$/i.test(request.title.trim())) {
    return request.title.trim();
  }
  const route = request.route;
  if (route) {
    const start = route.startLocation?.trim();
    const final = route.finalDestination?.trim();
    if (start && final && start.toLowerCase() !== final.toLowerCase()) {
      return `${start} → ${final}`;
    }
    if (final) return final;
    if (start) return start;
  }
  if (Array.isArray(request.days) && request.days.length > 0) {
    const locs = request.days.map((d) => d.location?.trim()).filter(Boolean);
    if (locs.length >= 2) return `${locs[0]} → ${locs[locs.length - 1]}`;
    if (locs.length === 1) return locs[0];
  }
  if (request.packageType === 'blue_cruise') return 'Blue Cruise Voyage';
  return request.id ? `Travel Request #${request.id}` : 'Travel Request';
}

export function toPublicRequest(request, { profile = null } = {}) {
  const title = request.title || null;
  const destination =
    request.destination ||
    request.route?.finalDestination ||
    request.route?.startLocation ||
    request.days?.[0]?.location ||
    null;
  const displayName = resolveRequestTitle(request);

  return {
    id: request.id,
    title,
    displayName,
    destination,
    travellerId: request.travellerId,
    routeId: request.routeId,
    status: request.status,
    travelStartDate: request.travelStartDate,
    travelEndDate: request.travelEndDate,
    chosenDuration:
      request.chosenDuration ??
      (request.travelStartDate && request.travelEndDate
        ? Math.round(
            (new Date(request.travelEndDate) - new Date(request.travelStartDate)) / 86400000,
          ) + 1
        : null),
    numberOfTravellers: request.numberOfTravellers,
    luggageCount: request.luggageCount,
    accommodationType: request.accommodationType,
    hotelRequired: request.hotelRequired,
    guideRequired: request.guideRequired,
    driverRequired: request.driverRequired,
    packageType: request.packageType,
    cruiseDuration: request.cruiseDuration ?? null,
    specialRequests: request.specialRequests,
    submittedAt: request.submittedAt,
    archivedAt: request.archivedAt ?? null,
    route: request.route ? toPublicRoute(request.route) : undefined,
    days: (request.days || []).map(toPublicDay),
    traveller: profile || undefined,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function loadRequest(requestId, travellerId, { models = null, withProfile = false } = {}) {
  const registry = models || initModels();
  const request = await registry.TravelRequest.findByPk(requestId, {
    include: [
      {
        model: registry.Route,
        as: 'route',
        include: [{ model: registry.RouteStop, as: 'stops' }],
      },
      { model: registry.TravelRequestDay, as: 'days' },
    ],
  });
  if (!request || request.travellerId !== Number(travellerId)) {
    throw new NotFoundError('Travel request not found.', { code: 'TRAVEL_REQUEST_NOT_FOUND' });
  }
  if (request.route?.stops) {
    request.route.stops.sort((a, b) => a.sequence - b.sequence);
  }
  if (request.days) {
    request.days.sort((a, b) => a.dayNumber - b.dayNumber);
  }
  let profile = null;
  if (withProfile) {
    const user = await registry.User.findByPk(request.travellerId);
    const travellerProfile = await registry.TravellerProfile.findOne({
      where: { userId: request.travellerId },
    });
    if (user) {
      profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: travellerProfile?.firstName ?? null,
        lastName: travellerProfile?.lastName ?? null,
        phone: travellerProfile?.phone ?? null,
      };
    }
  }
  return { request, profile };
}

async function resolveRouteId(travellerId, input, transaction, models) {
  if (input.routeId) {
    const route = await models.Route.findByPk(input.routeId, {
      include: [{ model: models.RouteStop, as: 'stops' }],
      transaction,
    });
    if (!route || route.travellerId !== Number(travellerId)) {
      throw new NotFoundError('Route not found.', { code: 'ROUTE_NOT_FOUND' });
    }
    return route.id;
  }
  // Inline route: calculate + persist inside the same transaction.
  const calculated = await calculateRouteForTraveller({ stops: input.inlineRoute.stops });
  const route = await models.Route.create(
    {
      travellerId,
      startLocation: calculated.startLocation,
      finalDestination: calculated.finalDestination,
      totalDistanceKm: calculated.distanceKm,
      estimatedDurationMinutes: calculated.durationMinutes,
      recommendedDays: calculated.recommendedDays,
      calculationProvider: calculated.calculationProvider,
      calculationVersion: calculated.calculationVersion,
      rawRouteData: calculated.rawResponse ?? null,
    },
    { transaction },
  );
  await models.RouteStop.bulkCreate(
    calculated.stops.map((s, index) => ({
      routeId: route.id,
      sequence: index,
      stopType: s.type,
      locationName: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      placeId: s.placeId ?? null,
    })),
    { transaction },
  );
  return route.id;
}

export async function createRequest(travellerId, input, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const created = await withTransaction(async (t) => {
    const routeId = await resolveRouteId(travellerId, input, t, models);
    const request = await models.TravelRequest.create(
      {
        travellerId,
        routeId,
        status: 'draft',
        travelStartDate: input.travelStartDate ?? null,
        travelEndDate: input.travelEndDate ?? null,
        numberOfTravellers: input.numberOfTravellers ?? 1,
        luggageCount: input.luggageCount ?? 0,
        accommodationType: input.accommodationType ?? null,
        hotelRequired: input.hotelRequired ?? false,
        guideRequired: input.guideRequired ?? false,
        driverRequired: input.driverRequired ?? false,
        packageType: input.packageType ?? null,
        cruiseDuration: input.cruiseDuration ?? null,
        specialRequests: input.specialRequests ?? null,
        title: input.title ?? null,
      },
      { transaction: t },
    );
    if (input.days && input.days.length > 0) {
      await models.TravelRequestDay.bulkCreate(
        input.days.map((d) => ({ ...d, travelRequestId: request.id })),
        { transaction: t },
      );
    }
    return request.id;
  });
  const { request, profile } = await loadRequest(created, travellerId, {
    models,
    withProfile: true,
  });
  return toPublicRequest(request, { profile });
}

export async function listRequests(travellerId, { role = null, includeArchived = false } = {}) {
  assertTraveller(role);
  const models = initModels();
  const where = { travellerId };
  if (!includeArchived) {
    where.archivedAt = null;
  }

  const rows = await models.TravelRequest.findAll({
    where,
    // NOTE: order by the physical `updated_at` column (not the
    // `updatedAt` attribute string) so the ORDER BY stays valid with
    // joined includes under `underscored: true` column mapping.
    order: [[models.sequelize.col('TravelRequest.updated_at'), 'DESC']],
    include: [
      {
        model: models.Route,
        as: 'route',
        include: [{ model: models.RouteStop, as: 'stops' }],
      },
      { model: models.TravelRequestDay, as: 'days' },
    ],
  });

  const requestIds = rows.map((r) => r.id);
  let quotesByRequestId = {};
  if (requestIds.length > 0) {
    const quotes = await models.Quotation.findAll({
      where: {
        travelRequestId: requestIds,
        status: ['submitted', 'accepted', 'rejected'],
      },
      attributes: ['id', 'travelRequestId', 'totalAmount', 'currency', 'status', 'created_at', 'updated_at'],
    });
    for (const q of quotes) {
      if (!quotesByRequestId[q.travelRequestId]) {
        quotesByRequestId[q.travelRequestId] = [];
      }
      quotesByRequestId[q.travelRequestId].push(q);
    }
  }

  return rows.map((r) => {
    if (r.route?.stops) r.route.stops.sort((a, b) => a.sequence - b.sequence);
    if (r.days) r.days.sort((a, b) => a.dayNumber - b.dayNumber);
    const pub = toPublicRequest(r);
    const relQuotes = quotesByRequestId[r.id] || [];
    pub.quotesCount = relQuotes.length;
    const latest = relQuotes[relQuotes.length - 1];
    pub.latestQuotePrice = latest ? Number(latest.totalAmount) : null;
    pub.latestQuoteCurrency = latest ? latest.currency : null;
    return pub;
  });
}

export async function getRequest(travellerId, requestId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request, profile } = await loadRequest(requestId, travellerId, { models, withProfile: true });

  // Load related quotations (lightweight / public)
  const quotationRows = await models.Quotation.findAll({
    where: { travelRequestId: request.id, status: ['submitted', 'accepted', 'rejected'] },
    include: [
      { model: models.QuotationItem, as: 'items' },
      { model: models.AgencyProfile, as: 'agency' },
    ],
    order: [[models.sequelize.col('Quotation.created_at'), 'DESC']],
  });
  const revealed = await isContactRevealedForRequest(request.id, { registry: models });

  const { ratingService } = await import('../ratings/rating.service.js');
  const agencyRatings = {};
  for (const q of quotationRows) {
    if (q.agencyId && agencyRatings[q.agencyId] === undefined) {
      try {
        agencyRatings[q.agencyId] = await ratingService.getAgencyRatingSummary(q.agencyId);
      } catch {
        agencyRatings[q.agencyId] = null;
      }
    }
  }

  const quotes = quotationRows.map((q) => {
    const ag = q.agency
      ? { ...(q.agency.toJSON ? q.agency.toJSON() : q.agency), ratingSummary: agencyRatings[q.agencyId] || null }
      : null;
    return toPublicQuotation(q, { agency: ag, revealed });
  });
  const acceptedQuote = quotes.find((q) => q.status === 'accepted') || null;

  // Load associated job if accepted / in progress
  let job = null;
  const jobRow = await models.Job.findOne({
    where: { travelRequestId: request.id },
    include: [{ model: models.AgencyProfile, as: 'agency' }],
  });
  if (jobRow) {
    job = toPublicJob(jobRow, {
      traveller: { participant: getTravellerContact(null, profile, { revealed }) },
      agency: jobAgencySnippet(jobRow.agency, { revealed }),
    });
  }

  const pub = toPublicRequest(request, { profile });
  pub.quotesCount = quotes.length;
  pub.quotes = quotes;
  pub.acceptedQuote = acceptedQuote;
  pub.job = job;
  return pub;
}

export async function deleteRequest(travellerId, requestId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });

  if (request.status === 'accepted') {
    throw new ValidationError('Accepted travel requests with an active or confirmed booking cannot be deleted.', {
      code: 'TRAVEL_REQUEST_NOT_DELETABLE',
    });
  }

  const job = await models.Job.findOne({ where: { travelRequestId: request.id } });
  if (job) {
    throw new ValidationError('Cannot delete travel request with an active job.', {
      code: 'TRAVEL_REQUEST_NOT_DELETABLE',
    });
  }

  const quotationCount = await models.Quotation.count({ where: { travelRequestId: request.id } });
  const conversationCount = await models.Conversation.count({ where: { travelRequestId: request.id } });

  // If operational records exist or state has progressed past draft: soft delete / archive
  if (quotationCount > 0 || conversationCount > 0 || request.status !== 'draft') {
    await request.update({ archivedAt: new Date() });
    return { success: true, archived: true, message: 'Travel request archived from your list.' };
  }

  // Clean, fresh draft: safe to delete
  await request.destroy();
  return { success: true, deleted: true, message: 'Draft travel request deleted.' };
}

function assertDraft(request) {
  if (request.status !== 'draft') {
    throw new ValidationError('Only draft requests can be edited.', {
      code: 'TRAVEL_REQUEST_NOT_EDITABLE',
    });
  }
}

export async function patchRequest(travellerId, requestId, patch, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertDraft(request);

  await withTransaction(async (t) => {
    const updatable = {};
    for (const key of [
      'title',
      'travelStartDate',
      'travelEndDate',
      'numberOfTravellers',
      'luggageCount',
      'accommodationType',
      'hotelRequired',
      'guideRequired',
      'driverRequired',
      'packageType',
      'cruiseDuration',
      'specialRequests',
    ]) {
      if (patch[key] !== undefined) updatable[key] = patch[key];
    }
    if (updatable.travelStartDate === undefined) delete updatable.travelStartDate;
    if (updatable.travelEndDate === undefined) delete updatable.travelEndDate;
    const start = updatable.travelStartDate ?? request.travelStartDate;
    const end = updatable.travelEndDate ?? request.travelEndDate;
    if (start && end && end < start) {
      throw new ValidationError('Travel end date cannot be before the start date.', {
        code: 'TRAVEL_REQUEST_VALIDATION_ERROR',
      });
    }
    if (Object.keys(updatable).length > 0) {
      await request.update(updatable, { transaction: t });
    }
    if (patch.days !== undefined) {
      await models.TravelRequestDay.destroy({
        where: { travelRequestId: request.id },
        transaction: t,
      });
      if (patch.days.length > 0) {
        await models.TravelRequestDay.bulkCreate(
          patch.days.map((d) => ({ ...d, travelRequestId: request.id })),
          { transaction: t },
        );
      }
    }
  });

  const { request: refreshed, profile } = await loadRequest(requestId, travellerId, {
    models,
    withProfile: true,
  });
  return toPublicRequest(refreshed, { profile });
}

function assertTransition(from, to) {
  const allowed = TRAVEL_REQUEST_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new ValidationError(`Cannot move a travel request from "${from}" to "${to}".`, {
      code: 'TRAVEL_REQUEST_INVALID_TRANSITION',
    });
  }
}

export async function submitRequest(travellerId, requestId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertTransition(request.status, 'submitted');
  if (!request.travelStartDate || !request.travelEndDate) {
    throw new ValidationError('Travel dates are required before submitting.', {
      code: 'TRAVEL_REQUEST_VALIDATION_ERROR',
    });
  }
  // Phase 5: flip to submitted AND match eligible agencies atomically;
  // notification events fire after commit so delivery failures can
  // never roll back the submission.
  const matches = await withTransaction(async (t) => {
    await request.update({ status: 'submitted', submittedAt: new Date() }, { transaction: t });
    return matchAgenciesForRequest(request.id, { transaction: t });
  });
  emitRequestMatchedEvents(request.id, matches);
  const { request: refreshed, profile } = await loadRequest(requestId, travellerId, {
    models,
    withProfile: true,
  });
  return toPublicRequest(refreshed, { profile });
}

export async function cancelRequest(travellerId, requestId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertTransition(request.status, 'cancelled');
  await request.update({ status: 'cancelled' });
  const { request: refreshed, profile } = await loadRequest(requestId, travellerId, {
    models,
    withProfile: true,
  });
  return toPublicRequest(refreshed, { profile });
}

export async function addDay(travellerId, requestId, dayInput, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertDraft(request);
  const day = validateDayInput(dayInput);
  const existing = await models.TravelRequestDay.findOne({
    where: { travelRequestId: request.id, dayNumber: day.dayNumber },
  });
  if (existing) {
    throw new ValidationError(`Day number ${day.dayNumber} already exists for this request.`, {
      code: 'TRAVEL_REQUEST_VALIDATION_ERROR',
    });
  }
  const created = await models.TravelRequestDay.create({ ...day, travelRequestId: request.id });
  return toPublicDay(created);
}

export async function patchDay(travellerId, requestId, dayId, dayInput, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertDraft(request);
  const day = await models.TravelRequestDay.findOne({
    where: { id: dayId, travelRequestId: request.id },
  });
  if (!day) {
    throw new NotFoundError('Travel request day not found.', {
      code: 'TRAVEL_REQUEST_DAY_NOT_FOUND',
    });
  }
  const merged = validateDayInput({ ...toPublicDay(day), ...dayInput });
  if (merged.dayNumber !== day.dayNumber) {
    const clash = await models.TravelRequestDay.findOne({
      where: { travelRequestId: request.id, dayNumber: merged.dayNumber },
    });
    if (clash) {
      throw new ValidationError(`Day number ${merged.dayNumber} already exists for this request.`, {
        code: 'TRAVEL_REQUEST_VALIDATION_ERROR',
      });
    }
  }
  await day.update(merged);
  return toPublicDay(day);
}

export async function deleteDay(travellerId, requestId, dayId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const { request } = await loadRequest(requestId, travellerId, { models });
  assertDraft(request);
  const day = await models.TravelRequestDay.findOne({
    where: { id: dayId, travelRequestId: request.id },
  });
  if (!day) {
    throw new NotFoundError('Travel request day not found.', {
      code: 'TRAVEL_REQUEST_DAY_NOT_FOUND',
    });
  }
  await day.destroy();
  return { deleted: true };
}
