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

  // In development, always allow the three standard localhost ports
  // so that the dev server works even if the env vars are not set or
  // the backend was started before the .env file was updated.
  if (process.env.NODE_ENV !== 'production') {
    const devDefaults = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
    ];
    for (const o of devDefaults) {
      if (!origins.includes(o)) origins.push(o);
    }
  }

  return origins;
}

export const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Allow non-browser requests (no Origin header, e.g. curl/health checks)
    // and any explicitly allow-listed origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
