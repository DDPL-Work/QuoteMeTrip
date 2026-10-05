import { Op } from 'sequelize';
import { initModels } from '../../../db/models/index.js';
import { NotFoundError } from '../../../utils/errors.js';
import { getCommissionSummaryData } from '../../commissions/commission.repository.js';

export async function getDashboardMetrics() {
  const models = initModels();

  const [
    pendingAgencies,
    approvedAgencies,
    suspendedAgencies,
    rejectedAgencies,
    pendingMemberships,
    activeMemberships,
    expiredMemberships,
    suspendedMemberships,
    totalRequests,
    submittedRequests,
    acceptedRequests,
    totalQuotations,
    activeJobs,
    completedJobs,
    commissionSummary,
  ] = await Promise.all([
    models.AgencyProfile.count({ where: { status: 'pending' } }),
    models.AgencyProfile.count({ where: { status: 'approved' } }),
    models.AgencyProfile.count({ where: { status: 'suspended' } }),
    models.AgencyProfile.count({ where: { status: 'rejected' } }),
    models.AgencyMembership.count({ where: { status: 'pending' } }),
    models.AgencyMembership.count({ where: { status: 'active' } }),
    models.AgencyMembership.count({ where: { status: 'expired' } }),
    models.AgencyMembership.count({ where: { status: 'suspended' } }),
    models.TravelRequest.count(),
    models.TravelRequest.count({ where: { status: 'submitted' } }),
    models.TravelRequest.count({ where: { status: 'accepted' } }),
    models.Quotation.count(),
    models.Job.count({ where: { status: { [Op.in]: ['accepted', 'in_progress'] } } }),
    models.Job.count({ where: { status: 'completed' } }),
    getCommissionSummaryData(),
  ]);

  return {
    agencies: {
      pending: pendingAgencies,
      approved: approvedAgencies,
      suspended: suspendedAgencies,
      rejected: rejectedAgencies,
      total: pendingAgencies + approvedAgencies + suspendedAgencies + rejectedAgencies,
    },
    memberships: {
      pending: pendingMemberships,
      active: activeMemberships,
      expired: expiredMemberships,
      suspended: suspendedMemberships,
      total: pendingMemberships + activeMemberships + expiredMemberships + suspendedMemberships,
    },
    marketplace: {
      totalRequests,
      submittedRequests,
      acceptedRequests,
      totalQuotations,
      activeJobs,
      completedJobs,
    },
    commissions: commissionSummary,
  };
}

export async function listAdminTravelRequests(query = {}) {
  const models = initModels();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20', 10)));
  const offset = (page - 1) * pageSize;

  const where = {};
  if (query.status) {
    where.status = query.status;
  }

  const { count, rows } = await models.TravelRequest.findAndCountAll({
    where,
    include: [
      {
        model: models.User,
        as: 'traveller',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: models.Route,
        as: 'route',
        include: [{ model: models.RouteStop, as: 'stops' }],
      },
      {
        model: models.Quotation,
        as: 'quotations',
        attributes: [
          'id',
          'agencyId',
          'status',
          'totalAmount',
          ['total_amount', 'priceTotal'],
          'currency',
        ],
      },
    ],
    order: [[models.sequelize.col('TravelRequest.created_at'), 'DESC']],
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

export async function getAdminTravelRequestById(id) {
  const models = initModels();
  const request = await models.TravelRequest.findByPk(id, {
    include: [
      {
        model: models.User,
        as: 'traveller',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: models.Route,
        as: 'route',
        include: [{ model: models.RouteStop, as: 'stops' }],
      },
      { model: models.TravelRequestDay, as: 'days' },
      {
        model: models.Quotation,
        as: 'quotations',
        include: [
          {
            model: models.AgencyProfile,
            as: 'agency',
            attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail'],
          },
          { model: models.QuotationItem, as: 'items' },
        ],
      },
      {
        model: models.Job,
        as: 'jobs',
        include: [
          {
            model: models.AgencyProfile,
            as: 'agency',
            attributes: ['id', 'agencyName'],
          },
        ],
      },
    ],
  });

  if (!request) {
    throw new NotFoundError('Travel request not found.');
  }

  return request;
}

export async function listAdminJobs(query = {}) {
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

  const { count, rows } = await models.Job.findAndCountAll({
    where,
    include: [
      {
        model: models.User,
        as: 'traveller',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: models.AgencyProfile,
        as: 'agency',
        attributes: ['id', 'agencyName', 'contactPerson', 'businessEmail', 'city', 'country'],
      },
      {
        model: models.TravelRequest,
        as: 'travelRequest',
        attributes: ['id', 'travelStartDate', 'travelEndDate', 'status'],
      },
      {
        model: models.Quotation,
        as: 'quotation',
        attributes: [
          'id',
          'totalAmount',
          ['total_amount', 'priceTotal'],
          'currency',
        ],
      },
      {
        model: models.Commission,
        as: 'commission',
      },
    ],
    order: [[models.sequelize.col('Job.created_at'), 'DESC']],
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

export async function getAdminJobById(id) {
  const models = initModels();
  const job = await models.Job.findByPk(id, {
    include: [
      {
        model: models.User,
        as: 'traveller',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: models.AgencyProfile,
        as: 'agency',
      },
      {
        model: models.TravelRequest,
        as: 'travelRequest',
        include: [{ model: models.Route, as: 'route' }],
      },
      {
        model: models.Quotation,
        as: 'quotation',
        include: [{ model: models.QuotationItem, as: 'items' }],
      },
      {
        model: models.Commission,
        as: 'commission',
      },
    ],
  });

  if (!job) {
    throw new NotFoundError('Job not found.');
  }

  return job;
}
