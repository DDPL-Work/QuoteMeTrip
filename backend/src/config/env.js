/**
 * Environment configuration & startup validator (Phase 9).
 *
 * Validates required configuration at boot time without exposing secrets.
 * Supports graceful degraded mode for optional third-party providers.
 */
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_IN_PRODUCTION = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
];

export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];

  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key] || process.env[key].trim() === '') {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      const errorMsg = `[CRITICAL] Server startup failed. Missing required production environment variables: ${missing.join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5001', 10),
    isProduction,
    providers: {
      weather: Boolean(process.env.WEATHER_API_KEY),
      googleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
      email: Boolean(process.env.SMTP_HOST),
      sms: Boolean(process.env.SMS_API_KEY),
      firebase: Boolean(process.env.FIREBASE_PROJECT_ID),
    },
  };
}
