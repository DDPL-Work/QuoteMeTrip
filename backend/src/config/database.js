/**
 * Database configuration (Phase 2 — MySQL + Sequelize foundation).
 *
 * Single source of truth for all database connectivity settings.
 * Values are read from environment variables so no credentials are
 * ever hard-coded. See `backend/.env.example`.
 *
 * Test isolation: when `NODE_ENV=test`, the runner scripts and tests
 * switch to the dedicated test database (`DB_TEST_NAME`) so destructive
 * test operations can never touch the development database.
 */

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isTestEnv() {
  return process.env.NODE_ENV === 'test';
}

export function getDatabaseConfig() {
  const test = isTestEnv();

  return {
    // Which physical database to connect to. Tests always use the
    // isolated test database, never the development database.
    database: test ? process.env.DB_TEST_NAME || 'troublefree_holiday_test' : process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // 127.0.0.1 (not `localhost`): on Windows `localhost` can resolve to
    // ::1 while Docker's port proxy listens on IPv4, causing ECONNREFUSED.
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInteger(process.env.DB_PORT, 3306),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: toInteger(process.env.DB_POOL_MAX, 10),
      min: toInteger(process.env.DB_POOL_MIN, 0),
      acquire: toInteger(process.env.DB_POOL_ACQUIRE, 30000),
      idle: toInteger(process.env.DB_POOL_IDLE, 10000),
    },
    define: {
      // Project-wide model conventions: snake_case columns,
      // plural snake_case table names, automatic timestamps.
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    dialectOptions: {
      // Fail fast on unreachable hosts instead of hanging.
      connectTimeout: toInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
    },
    // `true` in production: refuse to boot without a live database.
    // `false` locally: boot degraded and report via /health.
    requireOnBoot:
      process.env.DB_REQUIRE_ON_BOOT !== undefined
        ? process.env.DB_REQUIRE_ON_BOOT === 'true'
        : process.env.NODE_ENV === 'production',
  };
}

export function isTestDatabase() {
  return isTestEnv();
}
