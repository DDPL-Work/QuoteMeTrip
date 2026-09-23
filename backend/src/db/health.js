/**
 * Lightweight database health probe (Phase 2).
 *
 * Executes `SELECT 1` with a hard timeout so health checks never hang
 * when the database is unreachable. Returns a plain status object —
 * it never throws.
 */
import { getSequelize } from './sequelize.js';

const HEALTH_TIMEOUT_MS = 3000;

export async function checkDatabaseHealth() {
  const startedAt = Date.now();

  try {
    const sequelize = getSequelize();
    await Promise.race([
      sequelize.query('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('database health check timed out')), HEALTH_TIMEOUT_MS),
      ),
    ]);
    return { status: 'connected', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      status: 'unavailable',
      latencyMs: Date.now() - startedAt,
      error: err.message,
    };
  }
}
