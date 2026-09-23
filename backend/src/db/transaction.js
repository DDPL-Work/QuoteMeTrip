/**
 * Reusable transaction helper (Phase 2).
 *
 * Controllers/services must use this instead of building ad-hoc
 * transaction infrastructure:
 *
 *   import { withTransaction } from '../db/transaction.js';
 *
 *   await withTransaction(async (t) => {
 *     await User.create(payload, { transaction: t });
 *     await TravellerProfile.create({ ... }, { transaction: t });
 *   });
 *
 * The callback runs inside a managed transaction: commit on success,
 * automatic rollback on error.
 */
import { getSequelize } from './sequelize.js';

export async function withTransaction(work, { sequelize = getSequelize() } = {}) {
  return sequelize.transaction(async (transaction) => work(transaction));
}
