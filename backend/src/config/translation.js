/**
 * Translation configuration.
 *
 * Centralized settings for Google Cloud Translation Advanced (v3)
 * and the persistent MySQL translation cache.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SUPPORTED_LANGUAGES = ['en', 'tr'];
export const DEFAULT_LANGUAGE = 'en';

export function getTranslationConfig() {
  const isProd = process.env.NODE_ENV === 'production';

  // Check default path on VPS: /etc/quotemetrip/google-translation-sa.json
  // For local development, check relative path to backend key if present
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    const vpsPath = '/etc/quotemetrip/google-translation-sa.json';
    const localDevPath = path.resolve(__dirname, '../../api-project-642772088722-e7c870c3a5b7.json');
    if (fs.existsSync(vpsPath)) {
      credentialsPath = vpsPath;
    } else if (fs.existsSync(localDevPath)) {
      credentialsPath = localDevPath;
    } else {
      credentialsPath = vpsPath;
    }
  }

  const enabled =
    process.env.TRANSLATION_ENABLED !== undefined
      ? process.env.TRANSLATION_ENABLED === 'true'
      : true;

  const supportedLanguages = (
    process.env.TRANSLATION_SUPPORTED_LANGUAGES || 'en,tr'
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    enabled,
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'api-project-642772088722',
    credentialsPath,
    location: process.env.TRANSLATION_LOCATION || 'global',
    defaultLanguage: process.env.TRANSLATION_DEFAULT_LANGUAGE || DEFAULT_LANGUAGE,
    supportedLanguages: supportedLanguages.length > 0 ? supportedLanguages : SUPPORTED_LANGUAGES,
    version: process.env.TRANSLATION_VERSION || 'v1',
    providerName: 'google_cloud_v3',
    limits: {
      maxTextLength: 5000,
      maxBatchItems: 25,
      maxBatchChars: 10000,
      maxTransientLength: 2000,
      dailyCharBudget: parseInt(process.env.TRANSLATION_DAILY_CHAR_LIMIT || '500000', 10),
    },
    isProduction: isProd,
  };
}
