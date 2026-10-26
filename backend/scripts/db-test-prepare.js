/**
 * Prepare the isolated TEST database: migrate + seed.
 * `npm run db:test:prepare --workspace=@troublefree/backend`
 *
 * Always targets the test database (never development), regardless of
 * the caller's environment.
 */
import { pathToFileURL } from 'node:url';

// 1. Load environment configuration from .env without overwriting shell variables
await import('dotenv/config');

// 2. Validate environment before modifying NODE_ENV
export function assertTestDatabaseSafety({ nodeEnv, host, testDb, devDb, sequelizeDb, isLoopback }) {
  if (nodeEnv === 'production') {
    throw new Error('Refusing to run db:test:prepare in production environment.');
  }

  if (!isLoopback) {
    throw new Error(`Refusing to run db:test:prepare against non-loopback host: "${host}". Test database reset must only target local loopback.`);
  }

  const normalizedTestDb = (testDb || '').toLowerCase().trim();
  const normalizedDevDb = (devDb || 'troublefree_holiday').toLowerCase().trim();

  if (normalizedTestDb === normalizedDevDb || normalizedTestDb === 'troublefree_holiday') {
    throw new Error(`Refusing to drop development database "${testDb}".`);
  }

  if (!normalizedTestDb.endsWith('_test')) {
    throw new Error(`Test database name must end with "_test", received: "${testDb}".`);
  }

  if (sequelizeDb && sequelizeDb.toLowerCase().trim() !== normalizedTestDb) {
    throw new Error(`Sequelize target mismatch: expected "${normalizedTestDb}", got "${sequelizeDb}".`);
  }
}

export async function prepareTestDatabase() {
  const originalEnv = process.env.NODE_ENV;
  if (originalEnv === 'production') {
    console.error('[SAFETY ERROR] Refusing to run db:test:prepare in production environment.');
    process.exit(1);
  }

  // 3. Establish test environment only after verifying caller's environment is not production
  process.env.NODE_ENV = 'test';
  process.env.MAP_PROVIDER ||= 'haversine';

  // 4. Dynamically import environment-sensitive database config after test environment is set
  const { isLoopbackHost, getDatabaseConfig } = await import('../src/config/database.js');
  const mysql = (await import('mysql2/promise')).default;

  const host = process.env.DB_HOST || '127.0.0.1';
  const devDb = (process.env.DB_NAME || 'troublefree_holiday').toLowerCase();
  const resolvedTestDb = (process.env.DB_TEST_NAME || process.env.DB_NAME_TEST || 'troublefree_holiday_test').toLowerCase();
  const seqConfig = getDatabaseConfig();

  try {
    assertTestDatabaseSafety({
      nodeEnv: originalEnv,
      host,
      testDb: resolvedTestDb,
      devDb,
      sequelizeDb: seqConfig.database,
      isLoopback: isLoopbackHost(host),
    });
  } catch (err) {
    console.error(`[SAFETY ERROR] ${err.message}`);
    process.exit(1);
  }

  const port = Number(process.env.DB_PORT) || 3307;
  console.log(`[SAFETY CHECK PASSED] Preparing isolated test database "${resolvedTestDb}" on ${host}:${port}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  });
  await connection.query(`DROP DATABASE IF EXISTS \`${resolvedTestDb}\`;`);
  await connection.query(`CREATE DATABASE \`${resolvedTestDb}\`;`);
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
}

// Execute if run directly from CLI
const isDirectExecution = process.argv[1] && (
  import.meta.url === pathToFileURL(process.argv[1]).href ||
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/db-test-prepare.js')
);

if (isDirectExecution) {
  prepareTestDatabase().catch((err) => {
    console.error('[FATAL ERROR]', err);
    process.exit(1);
  });
}
