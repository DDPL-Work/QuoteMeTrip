/**
 * Google Cloud Translation Advanced (v3) provider integration.
 *
 * Exclusively executes server-side on Node.js. Credentials are never
 * exposed to browsers or client bundles.
 */
import fs from 'node:fs';
import { TranslationServiceClient } from '@google-cloud/translate';
import { getTranslationConfig } from '../config/translation.js';

let clientInstance = null;

export function getTranslationClient({ config = getTranslationConfig(), customClient = null } = {}) {
  if (customClient) {
    return customClient;
  }

  if (clientInstance) {
    return clientInstance;
  }

  const { credentialsPath, projectId } = config;

  if (credentialsPath && !fs.existsSync(credentialsPath)) {
    throw new Error(
      `[GoogleTranslation] Service account credentials not found at '${credentialsPath}'. ` +
        `Please ensure the key file is placed at '/etc/quotemetrip/google-translation-sa.json' ` +
        `with appropriate permissions (chmod 600) or configure GOOGLE_APPLICATION_CREDENTIALS.`,
    );
  }

  const clientOptions = {};
  if (projectId) {
    clientOptions.projectId = projectId;
  }
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    clientOptions.keyFilename = credentialsPath;
  }

  clientInstance = new TranslationServiceClient(clientOptions);
  return clientInstance;
}

export function resetTranslationClient() {
  clientInstance = null;
}

/**
 * Translate text via Google Cloud Translation Advanced v3.
 *
 * @param {object} params
 * @param {string} params.text - The plain text string to translate.
 * @param {string} params.sourceLanguage - Source language code ('en' or 'tr').
 * @param {string} params.targetLanguage - Target language code ('en' or 'tr').
 * @param {object} [options]
 * @param {object} [options.config] - Optional config override.
 * @param {object} [options.customClient] - Optional injected client for tests.
 * @returns {Promise<string>} Translated text string.
 */
export async function translateTextWithGoogle(
  { text, sourceLanguage, targetLanguage },
  { config = getTranslationConfig(), customClient = null } = {},
) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return '';
  }

  const client = getTranslationClient({ config, customClient });
  const location = config.location || 'global';
  const projectId = config.projectId;

  if (!projectId) {
    throw new Error('[GoogleTranslation] GOOGLE_CLOUD_PROJECT must be configured.');
  }

  const parent = `projects/${projectId}/locations/${location}`;

  const request = {
    parent,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: sourceLanguage,
    targetLanguageCode: targetLanguage,
  };

  try {
    const [response] = await client.translateText(request);
    const translation = response?.translations?.[0];
    if (!translation || translation.translatedText === undefined) {
      throw new Error('[GoogleTranslation] Empty translation response received from provider.');
    }
    return translation.translatedText;
  } catch (error) {
    // Sanitize error message to avoid printing any credentials or secrets
    const safeMessage = error?.message || 'Google Translation API request failed.';
    const err = new Error(`Google Translation API error: ${safeMessage}`);
    err.originalCode = error?.code;
    throw err;
  }
}
