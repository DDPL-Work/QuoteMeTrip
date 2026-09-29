import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError } from '../../utils/errors.js';
import * as repository from './commission.repository.js';
import { COMMISSION_DEFAULT_RATE_PERCENT, COMMISSION_ERROR_CODES } from './commission.constants.js';
import { logAudit } from '../audit/audit.service.js';

export function calculateCommission(jobAmount, ratePercentage = COMMISSION_DEFAULT_RATE_PERCENT) {
  const base = Math.max(0, parseFloat(jobAmount || 0));
  const rate = Math.max(0, parseFloat(ratePercentage || COMMISSION_DEFAULT_RATE_PERCENT));
  const amount = Number(((base * rate) / 100).toFixed(2));
  return {
    jobAmount: base,
    commissionRate: rate,
    commissionAmount: amount,
  };
}

export async function createCommissionForJob(
  jobId,
  { transaction = null, customRate = null } = {},
) {
  const models = initModels();
  const run = async (t) => {
    const job = await models.Job.findByPk(jobId, {
      include: [{ model: models.Quotation, as: 'quotation' }],
      transaction: t,
    });
    if (!job || !job.quotation) {
      throw new NotFoundError('Job or quotation not found.', {
        code: COMMISSION_ERROR_CODES.NOT_FOUND,
      });
    }

    const existing = await models.Commission.findOne({ where: { jobId: job.id }, transaction: t });
    if (existing) {
      return existing;
    }

    const jobAmount = parseFloat(job.quotation.priceTotal || 0);
    const rate = customRate !== null ? parseFloat(customRate) : COMMISSION_DEFAULT_RATE_PERCENT;
    const calc = calculateCommission(jobAmount, rate);

    return models.Commission.create(
      {
        agencyId: job.agencyId,
        jobId: job.id,
        quotationId: job.quotationId,
        jobAmount: calc.jobAmount,
        commissionRate: calc.commissionRate,
        commissionAmount: calc.commissionAmount,
        currency: job.quotation.currency || 'USD',
        status: 'pending',
      },
      { transaction: t },
    );
  };

  if (transaction) {
    return run(transaction);
  }
  return withTransaction(run);
}

export async function listCommissions(query) {
  return repository.findCommissions(query);
}

export async function getCommissionById(id) {
  const commission = await repository.findCommissionById(id);
  if (!commission) {
    throw new NotFoundError('Commission record not found.', {
      code: COMMISSION_ERROR_CODES.NOT_FOUND,
    });
  }
  return commission;
}

export async function updateCommissionStatus(
  id,
  { status, notes = null },
  actorUserId,
  context = {},
) {
  let updated;
  await withTransaction(async (t) => {
    const commission = await repository.findCommissionById(id, { transaction: t });
    if (!commission) {
      throw new NotFoundError('Commission record not found.', {
        code: COMMISSION_ERROR_CODES.NOT_FOUND,
      });
    }

    const beforeState = commission.toJSON();
    const updateData = { status };
    if (notes !== null) {
      updateData.notes = notes;
    }
    if (['confirmed', 'paid'].includes(status)) {
      updateData.confirmedBy = actorUserId;
      updateData.confirmedAt = new Date();
    }

    await commission.update(updateData, { transaction: t });
    updated = commission;

    await logAudit(
      {
        actorUserId,
        action: 'commission.updated',
        entityType: 'commission',
        entityId: commission.id,
        beforeState: { status: beforeState.status, notes: beforeState.notes },
        afterState: { status: updated.status, notes: updated.notes },
        ipAddress: context.ip,
      },
      { transaction: t },
    );
  });

  return repository.findCommissionById(updated.id);
}

export async function getCommissionSummary() {
  return repository.getCommissionSummaryData();
}
