/**
 * Structured Logger (Phase 9).
 *
 * Emits JSON formatted log events with correlation IDs, user context,
 * and automatic redaction of sensitive credential fields.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'refreshtoken',
  'accesstoken',
  'jwt',
  'credit_card',
]);

function redactObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = redactObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logInfo(message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    ...redactObject(meta),
  };
  console.log(JSON.stringify(logEntry));
}

export function logError(message, error = null, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        }
      : undefined,
    ...redactObject(meta),
  };
  console.error(JSON.stringify(logEntry));
}
