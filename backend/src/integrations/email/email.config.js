/**
 * Email configuration (Nodemailer SMTP integration).
 *
 * Reads SMTP credentials from backend environment variables.
 * Never hardcode secrets.
 */
import dotenv from 'dotenv';
dotenv.config();

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getEmailConfig() {
  const port = toInteger(process.env.SMTP_PORT, 587);
  const secureEnv = process.env.SMTP_SECURE;
  const secure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;

  return {
    host: process.env.SMTP_HOST || null,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER || null,
      pass: process.env.SMTP_PASS || null,
    },
    from: process.env.SMTP_FROM || 'QuoteMeTrip <noreply@quotemetrip.com>',
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  };
}
