/**
 * Prepare the isolated TEST database: migrate + seed.
 * `npm run db:test:prepare --workspace=@troublefree/backend`
 *
 * Always targets the test database (never development), regardless of
 * the caller's environment.
 */
process.env.NODE_ENV = 'test';

await import('dotenv/config');
const { getSequelize, closeDatabase } = await import('../src/db/sequelize.js');
const { initModels } = await import('../src/db/models/index.js');
const { migrateUp, runSeeds } = await import('../src/db/runner.js');

try {
  const sequelize = getSequelize();
  initModels(sequelize);
  const applied = await migrateUp(sequelize);
  const seeded = await runSeeds(sequelize);
  console.log(`Test database ready (migrations: ${applied.length}, seeders: ${seeded.length}).`);
} finally {
  await closeDatabase();
}
