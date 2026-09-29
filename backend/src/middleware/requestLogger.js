/**
 * Structured request logger middleware (Phase 9).
 *
 * Logs request start and completion with method, URL, status code, duration,
 * correlation request ID, and authenticated user ID when available.
 */
import { logInfo } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
      ip: req.ip || req.socket.remoteAddress,
    };

    if (process.env.NODE_ENV === 'test') {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
    } else {
      logInfo('HTTP Request', logData);
    }
  });

  next();
}
