/**
 * Minimal request logger for local development.
 *
 * This is generic infrastructure (not business logic), so unlike the
 * other Phase 1 middleware placeholders it is safe to implement now.
 * Replace with a proper logging library (e.g. pino/winston) when
 * observability requirements are defined.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}
