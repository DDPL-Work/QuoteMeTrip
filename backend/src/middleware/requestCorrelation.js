/**
 * Request Correlation ID middleware (Phase 9).
 *
 * Attaches a unique request ID (X-Request-ID) to every incoming request.
 * Exposes req.id for logs and returns X-Request-ID in response headers.
 */
import { randomUUID } from 'node:crypto';

export function requestCorrelation(req, res, next) {
  const correlationId = req.get('x-request-id') || req.get('x-correlation-id') || randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-ID', correlationId);
  next();
}
