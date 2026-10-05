/**
 * Audit Logging Service (Phase 7).
 *
 * Records and retrieves administrative actions for operational compliance.
 */
import { initModels } from '../../db/models/index.js';

export async function logAudit(
  {
    actorUserId,
    action,
    entityType,
    entityId,
    beforeState = null,
    afterState = null,
    ipAddress = null,
  },
  { transaction = null } = {},
) {
  const models = initModels();
  return models.AuditLog.create(
    {
      actorUserId,
      action,
      entityType,
      entityId,
      beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
      ipAddress,
    },
    { transaction },
  );
}

export async function listAuditLogs(query = {}) {
  const models = initModels();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20', 10)));
  const offset = (page - 1) * pageSize;

  const where = {};
  if (query.action) {
    where.action = query.action;
  }
  if (query.entityType) {
    where.entityType = query.entityType;
  }
  if (query.entityId) {
    where.entityId = parseInt(query.entityId, 10);
  }
  if (query.actorUserId) {
    where.actorUserId = parseInt(query.actorUserId, 10);
  }

  const { count, rows } = await models.AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: models.User,
        as: 'actor',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [[models.sequelize.col('AuditLog.created_at'), 'DESC']],
    limit: pageSize,
    offset,
  });

  return {
    items: rows.map((r) => {
      const data = r.toJSON ? r.toJSON() : r;
      return {
        ...data,
        createdAt: data.createdAt || data.created_at,
      };
    }),
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  };
}
