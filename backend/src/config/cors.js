/**
 * Environment-driven CORS configuration.
 *
 * Supports:
 * - Environment variables (WEB_TRAVELLER_URL, WEB_AGENCY_URL, WEB_ADMIN_URL, CORS_ALLOWED_ORIGINS, FRONTEND_URL)
 * - All local development ports on localhost and 127.0.0.1
 * - All Vercel deployments (*.vercel.app)
 * - All Render deployments (*.onrender.com)
 * - All QuoteMeTrip domains (quotemetrip.com and *.quotemetrip.com)
 */
export function isAllowedOrigin(origin) {
  // Allow non-browser requests (no Origin header, e.g. curl/health checks/mobile apps/server-to-server)
  if (!origin) {
    return true;
  }

  // 1. Explicitly configured origins via environment variables
  const envOrigins = [
    process.env.WEB_TRAVELLER_URL,
    process.env.WEB_AGENCY_URL,
    process.env.WEB_ADMIN_URL,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : []),
  ].filter(Boolean);

  if (envOrigins.includes(origin)) {
    return true;
  }

  // 2. Known production and staging domains
  const knownOrigins = [
    'https://quote-me-trip-omega.vercel.app',
    'https://quotemetrip-traveller.vercel.app',
    'https://quotemetrip-agency.vercel.app',
    'https://quotemetrip-admin.vercel.app',
    'https://quotemetrip.com',
    'https://www.quotemetrip.com',
    'http://quotemetrip.com',
    'http://www.quotemetrip.com',
    'https://quotemetrip.onrender.com',
  ];

  if (knownOrigins.includes(origin)) {
    return true;
  }

  // 3. Domain pattern matching (localhost, Vercel, Render, QuoteMeTrip)
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.localhost') ||
      hostname === 'quotemetrip.com' ||
      hostname.endsWith('.quotemetrip.com') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.onrender.com') ||
      hostname.endsWith('.troublefreeholidays.com') ||
      hostname.endsWith('.troublefreeholiday.com')
    ) {
      return true;
    }
  } catch {
    // Malformed origin
  }

  // In development, allow any origin
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
}

export const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-request-id',
  ],
  exposedHeaders: ['x-request-id', 'Content-Disposition'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours preflight cache
};

