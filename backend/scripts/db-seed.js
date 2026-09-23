/**
 * Run seeders (idempotent): `npm run db:seed --workspace=@troublefree/backend`
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { runSeeds } from '../src/db/runner.js';

try {
  const sequelize = getSequelize();
  const done = await runSeeds(sequelize);
  console.log(done.length === 0 ? 'No seeders found.' : `Seeded: ${done.join(', ')}`);
} finally {
  await closeDatabase();
}
