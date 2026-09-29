import { Op } from 'sequelize';
import { initModels } from '../../../db/models/index.js';

export async function findAgencies(query = {}) {
  const models = initModels();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20', 10)));
  const offset = (page - 1) * pageSize;

  const where = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    where[Op.or] = [
      { agencyName: { [Op.like]: term } },
      { contactPerson: { [Op.like]: term } },
      { businessEmail: { [Op.like]: term } },
      { city: { [Op.like]: term } },
      { country: { [Op.like]: term } },
    ];
  }

  const { count, rows } = await models.AgencyProfile.findAndCountAll({
    where,
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
    ],
    order: [[models.sequelize.col('AgencyProfile.created_at'), 'DESC']],
    limit: pageSize,
    offset,
    distinct: true,
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

export async function findAgencyById(id, { transaction = null } = {}) {
  const models = initModels();
  return models.AgencyProfile.findByPk(id, {
    include: [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'status', 'role', 'lastLoginAt'],
      },
      {
        model: models.AgencyDocument,
        as: 'documents',
        include: [{ model: models.User, as: 'verifier', attributes: ['id', 'name', 'email'] }],
      },
      {
        model: models.AgencyMembership,
        as: 'memberships',
        include: [
          { model: models.MembershipPlan, as: 'plan' },
          { model: models.User, as: 'confirmer', attributes: ['id', 'name', 'email'] },
        ],
      },
    ],
    transaction,
  });
}
