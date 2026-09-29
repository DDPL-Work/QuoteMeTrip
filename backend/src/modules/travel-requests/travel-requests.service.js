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

export function toPublicRequest(request, { profile = null } = {}) {
  return {
    id: request.id,
    travellerId: request.travellerId,
    routeId: request.routeId,
    status: request.status,
    travelStartDate: request.travelStartDate,
    travelEndDate: request.travelEndDate,
    numberOfTravellers: request.numberOfTravellers,
    luggageCount: request.luggageCount,
    accommodationType: request.accommodationType,
    hotelRequired: request.hotelRequired,
    guideRequired: request.guideRequired,
    driverRequired: request.driverRequired,
    packageType: request.packageType,
    specialRequests: request.specialRequests,
    submittedAt: request.submittedAt,
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
        specialRequests: input.specialRequests ?? null,
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

export async function listRequests(travellerId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const rows = await models.TravelRequest.findAll({
    where: { travellerId },
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
  return rows.map((r) => {
    if (r.route?.stops) r.route.stops.sort((a, b) => a.sequence - b.sequence);
    if (r.days) r.days.sort((a, b) => a.dayNumber - b.dayNumber);
    return toPublicRequest(r);
  });
}

export async function getRequest(travellerId, requestId, { role = null } = {}) {
  assertTraveller(role);
  const { request, profile } = await loadRequest(requestId, travellerId, { withProfile: true });
  return toPublicRequest(request, { profile });
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
      'travelStartDate',
      'travelEndDate',
      'numberOfTravellers',
      'luggageCount',
      'accommodationType',
      'hotelRequired',
      'guideRequired',
      'driverRequired',
      'packageType',
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
