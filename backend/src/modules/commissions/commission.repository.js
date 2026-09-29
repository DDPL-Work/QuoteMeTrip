import { initModels } from '../../db/models/index.js';

export async function findCommissions(query = {}) {
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
  if (query.jobId) {
    where.jobId = parseInt(query.jobId, 10);
  }

  const { count, rows } = await models.Commission.findAndCountAll({
    where,
    include: [
      {
        model: models.AgencyProfile,
        as: 'agency',
        attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail', 'city', 'country'],
      },
      {
        model: models.Job,
        as: 'job',
        attributes: ['id', 'status', 'acceptedAt'],
      },
      {
        model: models.Quotation,
        as: 'quotation',
        attributes: ['id', 'totalAmount', 'currency'],
      },
      {
        model: models.User,
        as: 'confirmer',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [[models.sequelize.col('Commission.created_at'), 'DESC']],
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

export async function findCommissionById(id, { transaction = null } = {}) {
  const models = initModels();
  return models.Commission.findByPk(id, {
    include: [
      {
        model: models.AgencyProfile,
        as: 'agency',
        attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail', 'city', 'country'],
      },
      {
        model: models.Job,
        as: 'job',
      },
      {
        model: models.Quotation,
        as: 'quotation',
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

export async function getCommissionSummaryData() {
  const models = initModels();
  const commissions = await models.Commission.findAll();

  let totalCommissionAmount = 0;
  let pendingAmount = 0;
  let confirmedAmount = 0;
  let paidAmount = 0;
  let cancelledAmount = 0;

  for (const c of commissions) {
    const amt = parseFloat(c.commissionAmount || 0);
    totalCommissionAmount += amt;
    if (c.status === 'pending') pendingAmount += amt;
    if (c.status === 'confirmed') confirmedAmount += amt;
    if (c.status === 'paid') paidAmount += amt;
    if (c.status === 'cancelled') cancelledAmount += amt;
  }

  return {
    totalRecords: commissions.length,
    totalCommissionAmount: Number(totalCommissionAmount.toFixed(2)),
    pendingAmount: Number(pendingAmount.toFixed(2)),
    confirmedAmount: Number(confirmedAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    cancelledAmount: Number(cancelledAmount.toFixed(2)),
  };
}
