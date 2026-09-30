/**
 * Environment-driven CORS configuration.
 *
 * In production this should resolve to a strict allowlist built
 * from environment variables. In development it allows the three
 * known local web app origins.
 */
function getAllowedOrigins() {
  const origins = [
    process.env.WEB_TRAVELLER_URL,
    process.env.WEB_AGENCY_URL,
    process.env.WEB_ADMIN_URL,
  ].filter(Boolean);

  // In development, always allow standard localhost ports
  if (process.env.NODE_ENV !== 'production') {
    const devDefaults = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5001',
    ];
    for (const o of devDefaults) {
      if (!origins.includes(o)) origins.push(o);
    }
  }

  return origins;
}

export const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header, e.g. curl/health checks/mobile)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Flexible matching for dev, local ports, or Vercel preview domains
    if (
      process.env.NODE_ENV !== 'production' ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
