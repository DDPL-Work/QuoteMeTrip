/**
 * Prepare the isolated TEST database: migrate + seed.
 * `npm run db:test:prepare --workspace=@troublefree/backend`
 *
 * Always targets the test database (never development), regardless of
 * the caller's environment.
 */
process.env.NODE_ENV = 'test';

await import('dotenv/config');
import mysql from 'mysql2/promise';

const dbName = process.env.DB_TEST_NAME || process.env.DB_NAME_TEST || 'troublefree_holiday_test';
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
});
await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
await connection.query(`CREATE DATABASE \`${dbName}\`;`);
await connection.end();

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
