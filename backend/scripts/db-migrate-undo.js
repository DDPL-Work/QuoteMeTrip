/**
 * Revert recent migrations: `npm run db:migrate:undo --workspace=@troublefree/backend`
 * Optional: `--steps=N` (default 1).
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { migrateDown } from '../src/db/runner.js';

const stepsArg = process.argv.find((arg) => arg.startsWith('--steps='));
const steps = stepsArg ? Number.parseInt(stepsArg.split('=')[1], 10) : 1;

try {
  const sequelize = getSequelize();
  const reverted = await migrateDown(sequelize, steps);
  console.log(reverted.length === 0 ? 'Nothing to revert.' : `Reverted: ${reverted.join(', ')}`);
} finally {
  await closeDatabase();
}
