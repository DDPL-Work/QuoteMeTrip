/**
 * Undo seeders: `npm run db:seed:undo --workspace=@troublefree/backend`
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { undoSeeds } from '../src/db/runner.js';

try {
  const sequelize = getSequelize();
  const done = await undoSeeds(sequelize);
  console.log(done.length === 0 ? 'No seeders found.' : `Unseeded: ${done.join(', ')}`);
} finally {
  await closeDatabase();
}
