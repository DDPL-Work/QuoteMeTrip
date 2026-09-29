/**
 * Agency-matching service (Phase 5).
 *
 * Matching runs when a Traveller submits a request: eligible agencies
 * get a `travel_request_agencies` row (idempotent — existing pairs are
 * skipped, reinforced by the UNIQUE constraint). Region/route-based
 * refinement belongs here later via `isAgencyEligibleForRequest()`.
 */
import { Op } from 'sequelize';
import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { toPublicRoute } from '../routes/routes.service.js';
import * as repository from './matching.repository.js';
import { MATCH_ERROR_CODES, INBOX_VISIBLE_MATCH_STATUSES } from './matching.constants.js';
import {
  NOTIFICATION_EVENTS,
  emitNotificationEvent,
} from '../notifications/notification-events.js';
import { isContactRevealedForRequest, getTravellerContact } from '../contact/contact-visibility.js';

function assertAgency(role) {
  if (role && role !== 'agency') {
    throw new ForbiddenError('Only agencies can access this resource.', {
      code: MATCH_ERROR_CODES.FORBIDDEN,
    });
  }
}

async function resolveAgency(registry, userId, { transaction = null } = {}) {
  const agency = await registry.AgencyProfile.findOne({ where: { userId }, transaction });
  if (!agency) {
    throw new NotFoundError('Agency profile not found.', { code: MATCH_ERROR_CODES.NOT_FOUND });
  }
  return agency;
}

/**
 * Region/request eligibility extension point. Phase 5 matches every
 * eligible agency; geographic or route-based rules override or wrap
 * this function in later phases without touching the pipeline.
 */
// eslint-disable-next-line no-unused-vars
export function isAgencyEligibleForRequest(agency, request) {
  return true;
}

function assertSubmittable(request) {
  if (!request || !['submitted', 'matching', 'quoted'].includes(request.status)) {
    throw new ValidationError('Only submitted requests can be matched to agencies.', {
      code: MATCH_ERROR_CODES.VALIDATION_ERROR,
    });
  }
}

/**
 * Match all eligible agencies to a submitted request. Idempotent:
 * already-matched pairs are skipped (no duplicates). Runs inside the
 * caller's transaction when one is supplied.
 *
 * Returns the newly created match rows. The caller emits
 * REQUEST_MATCHED events AFTER commit so notification failures can
 * never corrupt the transaction.
 */
export async function matchAgenciesForRequest(requestId, { transaction = null } = {}) {
  const run = async (t) => {
    const request = await repository.findRequestById(requestId, { transaction: t });
    assertSubmittable(request);
    const eligible = await repository.findEligibleAgencies({ transaction: t });
    const created = [];
    for (const agency of eligible.filter((a) => isAgencyEligibleForRequest(a, request))) {
      const existing = await repository.findExistingMatch(request.id, agency.id, {
        transaction: t,
      });
      if (existing) {
        continue;
      }
      created.push(
        await repository.createMatch(
          { travelRequestId: request.id, agencyId: agency.id },
          { transaction: t },
        ),
      );
    }
    return created;
  };

  if (transaction) {
    return run(transaction);
  }
  return withTransaction(run);
}

export function emitRequestMatchedEvents(requestId, matches) {
  for (const match of matches) {
    emitNotificationEvent(NOTIFICATION_EVENTS.REQUEST_MATCHED, {
      travelRequestId: requestId,
      agencyId: match.agencyId,
      matchId: match.id,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Agency inbox                                                        */
/* ------------------------------------------------------------------ */

function toPublicTravellerSnippet(user, travellerProfile, { revealed = false } = {}) {
  // Contact protection: only the first name is exposed until the
  // request's contact is revealed (live job post-acceptance).
  return getTravellerContact(user, travellerProfile, { revealed });
}

function toPublicInboxRequest(request, match, { user = null, profile = null, revealed = false }) {
  return {
    id: request.id,
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
    days: (request.days || [])
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        date: d.date,
        location: d.location,
        title: d.title,
        description: d.description,
        hotelNotes: d.hotelNotes,
        guideNotes: d.guideNotes,
        driverNotes: d.driverNotes,
        specialRequirements: d.specialRequirements,
      })),
    traveller: toPublicTravellerSnippet(user, profile, { revealed }),
    match: match
      ? {
          id: match.id,
          matchStatus: match.matchStatus,
          matchedAt: match.matchedAt,
          viewedAt: match.viewedAt,
          respondedAt: match.respondedAt,
        }
      : undefined,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function findMatchOrThrow(models, agencyId, requestId, { transaction = null } = {}) {
  const match = await models.TravelRequestAgency.findOne({
    where: { travelRequestId: requestId, agencyId },
    transaction,
  });
  if (!match) {
    // Intentionally 404: an agency must not learn whether an
    // unmatched request exists.
    throw new NotFoundError('Travel request not found.', { code: MATCH_ERROR_CODES.NOT_FOUND });
  }
  return match;
}

export async function listInboxRequests(userId, filters, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);

  const matchWhere = { agencyId: agency.id };
  if (filters.matchStatus) {
    matchWhere.matchStatus = filters.matchStatus;
  } else {
    matchWhere.matchStatus = { [Op.in]: INBOX_VISIBLE_MATCH_STATUSES };
  }

  const requestWhere = {};
  if (filters.status) {
    requestWhere.status = filters.status;
  }
  if (filters.from || filters.to) {
    requestWhere.travelStartDate = {};
    if (filters.from) {
      requestWhere.travelStartDate[Op.gte] = filters.from;
    }
    if (filters.to) {
      requestWhere.travelStartDate[Op.lte] = filters.to;
    }
  }

  const matches = await models.TravelRequestAgency.findAll({
    where: matchWhere,
    include: [
      {
        model: models.TravelRequest,
        as: 'travelRequest',
        where: requestWhere,
        required: true,
        include: [
          {
            model: models.Route,
            as: 'route',
            include: [{ model: models.RouteStop, as: 'stops' }],
          },
          { model: models.TravelRequestDay, as: 'days' },
        ],
      },
    ],
    order: [[models.sequelize.col('TravelRequestAgency.updated_at'), 'DESC']],
  });

  let rows = matches;
  if (filters.destination) {
    const needle = filters.destination.toLowerCase();
    rows = matches.filter((m) => {
      const r = m.travelRequest;
      const haystacks = [
        r.route?.startLocation,
        r.route?.finalDestination,
        ...(r.route?.stops || []).map((s) => s.locationName),
        ...(r.days || []).map((d) => d.location),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return haystacks.some((h) => h.includes(needle));
    });
  }

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const sliced = rows.slice((page - 1) * filters.pageSize, page * filters.pageSize);

  const requests = [];
  for (const match of sliced) {
    const request = match.travelRequest;
    if (request.route?.stops) {
      request.route.stops.sort((a, b) => a.sequence - b.sequence);
    }
    requests.push(toPublicInboxRequest(request, match, await contactContext(models, request)));
  }

  return {
    requests,
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
  };
}

export async function getInboxRequest(userId, requestId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const match = await findMatchOrThrow(models, agency.id, requestId);
  const request = await models.TravelRequest.findByPk(requestId, {
    include: [
      {
        model: models.Route,
        as: 'route',
        include: [{ model: models.RouteStop, as: 'stops' }],
      },
      { model: models.TravelRequestDay, as: 'days' },
    ],
  });
  if (!request) {
    throw new NotFoundError('Travel request not found.', { code: MATCH_ERROR_CODES.NOT_FOUND });
  }
  if (request.route?.stops) {
    request.route.stops.sort((a, b) => a.sequence - b.sequence);
  }
  return toPublicInboxRequest(request, match, await contactContext(models, request));
}

async function contactContext(models, request) {
  const user = await models.User.findByPk(request.travellerId);
  const profile = await models.TravellerProfile.findOne({
    where: { userId: request.travellerId },
  });
  const revealed = await isContactRevealedForRequest(request.id, { registry: models });
  return { user, profile, revealed };
}

export async function markRequestViewed(userId, requestId, { role = null } = {}) {
  assertAgency(role);
  const models = initModels();
  const agency = await resolveAgency(models, userId);
  const match = await findMatchOrThrow(models, agency.id, requestId);
  if (match.matchStatus === 'matched') {
    await match.update({ matchStatus: 'viewed', viewedAt: new Date() });
  } else if (!match.viewedAt) {
    await match.update({ viewedAt: new Date() });
  }
  return { id: match.id, matchStatus: match.matchStatus, viewedAt: match.viewedAt };
}
