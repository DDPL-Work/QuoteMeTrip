import { initModels } from '../../../db/models/index.js';

export async function findMembershipPlans() {
  const models = initModels();
  return models.MembershipPlan.findAll({
    order: [['price', 'ASC']],
  });
}

export async function findMembershipPlanById(id, { transaction = null } = {}) {
  const models = initModels();
  return models.MembershipPlan.findByPk(id, { transaction });
}

export async function createMembershipPlan(data, { transaction = null } = {}) {
  const models = initModels();
  return models.MembershipPlan.create(data, { transaction });
}

export async function findMemberships(query = {}) {
  const models = initModels();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20', 10)));
  const offset = (page - 1) * pageSize;

  const where = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.agencyId) {
    where.agencyId = parseInt(query.agencyId, 10);
  }

  const { count, rows } = await models.AgencyMembership.findAndCountAll({
    where,
    include: [
      {
        model: models.AgencyProfile,
        as: 'agency',
        attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail', 'status'],
      },
      {
        model: models.MembershipPlan,
        as: 'plan',
      },
      {
        model: models.User,
        as: 'confirmer',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [[models.sequelize.col('AgencyMembership.created_at'), 'DESC']],
    limit: pageSize,
    offset,
  });

  return {
    items: rows,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  };
}

export async function findMembershipById(id, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyMembership.findByPk(id, {
    include: [
      {
        model: models.AgencyProfile,
        as: 'agency',
        attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail', 'status'],
      },
      {
        model: models.MembershipPlan,
        as: 'plan',
      },
      {
        model: models.User,
        as: 'confirmer',
        attributes: ['id', 'name', 'email'],
      },
    ],
    transaction,
  });
}
