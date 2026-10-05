/**
 * Agency-matching repository (Phase 5).
 *
 * Queries only — business rules live in matching.service.js.
 */
import { Op } from 'sequelize';
import { initModels } from '../../db/models/index.js';

export async function findRequestById(requestId, { transaction = null, registry = null } = {}) {
  const models = registry || initModels();
  return models.TravelRequest.findByPk(requestId, {
    include: [
      {
        model: models.Route,
        as: 'route',
        include: [{ model: models.RouteStop, as: 'stops' }],
      },
      { model: models.TravelRequestDay, as: 'days' },
    ],
    transaction,
  });
}

export async function findExistingMatch(travelRequestId, agencyId, { transaction = null } = {}) {
  const models = initModels();
  return models.TravelRequestAgency.findOne({
    where: { travelRequestId, agencyId },
    transaction,
  });
}

export async function createMatch({ travelRequestId, agencyId }, { transaction = null } = {}) {
  const models = initModels();
  const [row] = await models.TravelRequestAgency.findOrCreate({
    where: { travelRequestId, agencyId },
    defaults: { travelRequestId, agencyId, matchStatus: 'matched', matchedAt: new Date() },
    transaction,
  });
  return row;
}

/**
 * Candidate agencies: profile approved + user active/agency + active membership
 * + eagerly loaded coverages and capabilities for eligibility evaluation.
 */
export async function findEligibleAgencies({ transaction = null } = {}) {
  const models = initModels();
  const now = new Date();
  return models.AgencyProfile.findAll({
    where: { status: 'approved' },
    include: [
      {
        model: models.User,
        as: 'user',
        where: { status: 'active', role: 'agency' },
        required: true,
      },
      {
        model: models.AgencyMembership,
        as: 'memberships',
        where: {
          status: 'active',
          startsAt: { [Op.lte]: now },
          [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }],
        },
        required: true,
      },
      {
        model: models.AgencyCoverage,
        as: 'coverages',
        required: false,
      },
      {
        model: models.AgencyCapability,
        as: 'capabilities',
        required: false,
      },
    ],
    transaction,
  });
}

export async function findAgencyProfileByUserId(userId, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyProfile.findOne({ where: { userId }, transaction });
}
