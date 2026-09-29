/**
 * Backend startup sequence (Phase 2 & Phase 9):
 *
 *   load & validate configuration
 *     -> initialize Sequelize + models/associations
 *     -> verify database connectivity
 *     -> start HTTP server & Socket.IO
 *
 * If required production config is missing, fail fast at startup.
 */
import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { validateEnvironment } from './config/env.js';
import { getDatabaseConfig } from './config/database.js';
import { getSequelize, connectDatabase, closeDatabase } from './db/sequelize.js';
import { initModels } from './db/models/index.js';
import { initSocketServer, closeSocketServer } from './realtime/socket.js';

const PORT = process.env.PORT || 5000;

async function boot() {
  const envInfo = validateEnvironment();
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

  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(PORT, () => {
    console.log(`troublefree-holiday-backend listening on port ${PORT} (${envInfo.nodeEnv})`);
  });

  function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    server.close(async (err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }

      try {
        await closeSocketServer();
        await closeDatabase();
        console.log('Database connection closed.');
      } catch (closeErr) {
        console.error('Error closing database connection:', closeErr.message);
      }

      console.log('Server closed. Goodbye.');
      process.exit(0);
    });

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
