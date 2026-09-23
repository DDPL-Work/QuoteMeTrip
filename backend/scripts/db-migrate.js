/**
 * Apply pending migrations: `npm run db:migrate --workspace=@troublefree/backend`
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { initModels } from '../src/db/models/index.js';
import { migrateUp } from '../src/db/runner.js';

try {
  const sequelize = getSequelize();
  initModels(sequelize);
  const applied = await migrateUp(sequelize);
  console.log(applied.length === 0 ? 'No pending migrations.' : `Applied: ${applied.join(', ')}`);
} finally {
  await closeDatabase();
}
