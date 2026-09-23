/**
 * Centralized Sequelize instance (Phase 2).
 *
 * There is exactly ONE Sequelize instance per process. Models must
 * never create their own connections — they receive this instance
 * from `src/db/models/index.js`.
 *
 * Importing this module does NOT open a connection. Connections are
 * established lazily by `connectDatabase()` (called at boot) or by
 * the first query. This keeps `src/app.js` import-safe for unit tests.
 */
import { Sequelize } from 'sequelize';
import { getDatabaseConfig } from '../config/database.js';

let sequelize = null;

export function getSequelize() {
  if (!sequelize) {
    const config = getDatabaseConfig();
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      pool: config.pool,
      define: config.define,
      dialectOptions: config.dialectOptions,
    });
  }

  return sequelize;
}

/**
 * Verify connectivity (`SELECT 1` equivalent). Resolves on success,
 * rejects with the driver error on failure.
 */
export async function connectDatabase() {
  const instance = getSequelize();
  await instance.authenticate();
  return instance;
}

/**
 * Gracefully close the connection pool. Safe to call when no
 * connection was ever opened.
 */
export async function closeDatabase() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

/**
 * Test-only helper: drop the singleton so the next `getSequelize()`
 * call builds a fresh instance (used when switching between the
 * development and test databases in one process).
 */
export function resetSequelizeInstance() {
  sequelize = null;
}
