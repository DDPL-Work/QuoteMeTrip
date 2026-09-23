/**
 * Backend startup sequence (Phase 2):
 *
 *   load configuration
 *     -> initialize Sequelize + models/associations
 *     -> verify database connectivity
 *     -> start HTTP server
 *
 * If the database is unavailable, behavior depends on configuration:
 * - production (or DB_REQUIRE_ON_BOOT=true): fail fast, exit non-zero.
 * - development/test: boot degraded, report via /api/v1/health.
 */
import 'dotenv/config';
import app from './app.js';
import { getDatabaseConfig } from './config/database.js';
import { getSequelize, connectDatabase, closeDatabase } from './db/sequelize.js';
import { initModels } from './db/models/index.js';

const PORT = process.env.PORT || 5000;

async function boot() {
  const dbConfig = getDatabaseConfig();

  initModels(getSequelize());

  try {
    await connectDatabase();
    console.log('Database connection established.');
  } catch (err) {
    console.error(`Database unavailable: ${err.message}`);
    if (dbConfig.requireOnBoot) {
      console.error('Refusing to boot without a database (production policy).');
      process.exit(1);
    }
    console.warn('Continuing without a database (degraded mode). See /api/v1/health.');
  }

  const server = app.listen(PORT, () => {
    console.log(
      `troublefree-holiday-backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`,
    );
  });

  function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    server.close(async (err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }

      try {
        await closeDatabase();
        console.log('Database connection closed.');
      } catch (closeErr) {
        console.error('Error closing database connection:', closeErr.message);
      }

      // Future phases: close socket server and job workers here.
      console.log('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force-exit if shutdown hangs.
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

boot().catch((err) => {
  console.error('Fatal error during boot:', err);
  process.exit(1);
});
