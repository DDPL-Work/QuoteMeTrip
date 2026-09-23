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
