/**
 * Remove stale refresh sessions (Phase 3).
 *
 *   npm run auth:cleanup --workspace=@troublefree/backend
 *
 * Deletes expired sessions and sessions revoked longer than 30 days
 * ago. Run on a schedule (cron / task scheduler) in deployed
 * environments. No Redis or job queue is introduced for this.
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { initModels } from '../src/db/models/index.js';
import { deleteStaleSessions } from '../src/modules/auth/auth.repository.js';

try {
  const sequelize = getSequelize();
  initModels(sequelize);
  const deleted = await deleteStaleSessions();
  console.log(`auth:cleanup removed ${deleted} stale session(s).`);
} catch (err) {
  console.error(`auth:cleanup failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
