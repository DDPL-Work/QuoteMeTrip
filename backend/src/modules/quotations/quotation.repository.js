/**
 * Quotation repository (Phase 5). Queries only.
 */
import { initModels } from '../../db/models/index.js';

export async function findActiveQuotation(travelRequestId, agencyId, { transaction = null } = {}) {
  const models = initModels();
  return models.Quotation.findOne({
    where: { travelRequestId, agencyId, status: ['draft', 'submitted'] },
    transaction,
  });
}

export async function findQuotationById(quotationId, { transaction = null } = {}) {
  const models = initModels();
  return models.Quotation.findByPk(quotationId, {
    include: [{ model: models.QuotationItem, as: 'items' }],
    transaction,
  });
}
