import { initModels } from '../../db/models/index.js';

export async function findAgencyProfileByUserId(userId, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyProfile.findOne({
    where: { userId },
    include: [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'status', 'role', 'lastLoginAt'],
      },
      {
        model: models.AgencyDocument,
        as: 'documents',
      },
      {
        model: models.AgencyMembership,
        as: 'memberships',
        include: [{ model: models.MembershipPlan, as: 'plan' }],
      },
      {
        model: models.AgencyCoverage,
        as: 'coverages',
      },
      {
        model: models.AgencyCapability,
        as: 'capabilities',
      },
    ],
    transaction,
  });
}

export async function getCanonicalDestinationsAndRegions({ transaction = null } = {}) {
  const models = initModels();
  const destinations = await models.TravelGuideDestination.findAll({
    attributes: ['id', 'name', 'slug', 'country', 'regionId'],
    where: { status: 'published' },
    order: [['name', 'ASC']],
    transaction,
  });
  const regions = await models.TravelGuideRegion.findAll({
    attributes: ['id', 'name', 'slug'],
    where: { status: 'published' },
    order: [['name', 'ASC']],
    transaction,
  });
  return { destinations, regions };
}

export async function replaceAgencyCoverages(agencyId, locations, { transaction } = {}) {
  const models = initModels();

  // Delete existing coverages
  await models.AgencyCoverage.destroy({
    where: { agencyId },
    transaction,
  });

  if (!locations || locations.length === 0) {
    return [];
  }

  // Create new coverage rows
  const rows = locations.map((loc) => ({
    agencyId,
    locationName: loc,
  }));

  return models.AgencyCoverage.bulkCreate(rows, { transaction });
}

export async function replaceAgencyCapabilities(agencyId, serviceTypes, { transaction } = {}) {
  const models = initModels();

  // Delete existing capabilities
  await models.AgencyCapability.destroy({
    where: { agencyId },
    transaction,
  });

  if (!serviceTypes || serviceTypes.length === 0) {
    return [];
  }

  const rows = serviceTypes.map((srv) => ({
    agencyId,
    serviceType: srv,
    isEnabled: true,
  }));

  return models.AgencyCapability.bulkCreate(rows, { transaction });
}

export async function findAgencyDocuments(agencyId, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyDocument.findAll({
    where: { agencyId },
    order: [['createdAt', 'DESC']],
    transaction,
  });
}

export async function createAgencyDocument(data, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyDocument.create(data, { transaction });
}

export async function findAgencyDocumentById(documentId, agencyId, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyDocument.findOne({
    where: { id: documentId, agencyId },
    transaction,
  });
}

export async function destroyAgencyDocument(documentId, agencyId, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyDocument.destroy({
    where: { id: documentId, agencyId },
    transaction,
  });
}

export async function updateAgreementAcceptance(agencyId, { agreementVersion = 'v1.0', acceptedAt = new Date() }, { transaction = null } = {}) {
  const models = initModels();
  await models.AgencyProfile.update(
    {
      agreementAccepted: true,
      agreementAcceptedAt: acceptedAt,
      agreementVersion,
    },
    { where: { id: agencyId }, transaction },
  );

  await models.AgencyMembership.update(
    {
      agreementAccepted: true,
      agreementAcceptedAt: acceptedAt,
      agreementVersion,
    },
    { where: { agencyId }, transaction },
  );
}
