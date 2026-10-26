/**
 * Cache-first Translation Service.
 *
 * Implements deterministic SHA-256 cache-key computation, persistent MySQL
 * storage in `TranslationCache`, in-process request coalescing, strict allowlists,
 * and integration with Google Cloud Translation Advanced v3.
 */
import crypto from 'node:crypto';
import { getTranslationConfig } from '../../config/translation.js';
import { translateTextWithGoogle } from '../../integrations/google-translation.js';
import { TranslationCache } from '../../db/models/index.js';
import { ValidationError, NotFoundError, ForbiddenError, AppError } from '../../utils/errors.js';
import {
  ALLOWED_TRANSLATABLE_FIELDS,
  PUBLIC_CONTENT_TYPES,
  TRANSLATION_ERROR_CODES,
} from './translation.constants.js';

// In-process request coalescing to eliminate duplicate external calls for concurrent cache misses
const inflightRequests = new Map();

// In-memory observability metrics
const stats = {
  cacheHits: 0,
  cacheMisses: 0,
  successfulTranslations: 0,
  failedTranslations: 0,
  totalCharactersTranslated: 0,
  charactersToday: 0,
  startedAt: new Date().toISOString(),
};

export function getTranslationStats() {
  const config = getTranslationConfig();
  return {
    ...stats,
    enabled: config.enabled,
    dailyCharBudget: config.limits.dailyCharBudget,
    supportedLanguages: config.supportedLanguages,
    provider: config.providerName,
    version: config.version,
  };
}

export function resetTranslationStats() {
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.successfulTranslations = 0;
  stats.failedTranslations = 0;
  stats.totalCharactersTranslated = 0;
  stats.charactersToday = 0;
  stats.startedAt = new Date().toISOString();
  inflightRequests.clear();
}

/**
 * Compute SHA-256 hash of source content.
 */
export function computeSourceHash(sourceText) {
  return crypto.createHash('sha256').update(String(sourceText ?? ''), 'utf8').digest('hex');
}

/**
 * Generate a deterministic, collision-resistant cache key.
 */
export function computeCacheKey({
  contentType,
  contentId,
  fieldName,
  sourceLanguage,
  targetLanguage,
  sourceHash,
  provider,
  version,
  scope,
}) {
  const payload = [
    scope || 'public',
    contentType,
    String(contentId),
    fieldName,
    sourceLanguage.toLowerCase(),
    targetLanguage.toLowerCase(),
    sourceHash,
    provider,
    version,
  ].join('::');

  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Cache-first translation method.
 *
 * Checks MySQL translation_cache table. On miss, coalesces concurrent requests,
 * queries Google Cloud Translation Advanced v3, and saves successful translations to MySQL.
 */
export async function getOrTranslate(
  {
    contentType = 'transient',
    contentId = '0',
    fieldName = 'text',
    sourceLanguage = 'en',
    targetLanguage = 'tr',
    sourceText = '',
    scope = 'public',
  },
  { customClient = null, config = getTranslationConfig() } = {},
) {
  const srcLang = (sourceLanguage || 'en').trim().toLowerCase();
  const tgtLang = (targetLanguage || 'tr').trim().toLowerCase();

  // 1. Language validation
  if (!config.supportedLanguages.includes(srcLang) || !config.supportedLanguages.includes(tgtLang)) {
    throw new ValidationError(
      `Unsupported translation language: ${srcLang} -> ${tgtLang}. Supported: ${config.supportedLanguages.join(', ')}`,
      { code: TRANSLATION_ERROR_CODES.INVALID_LANGUAGE },
    );
  }

  // 2. Validate empty text
  if (!sourceText || typeof sourceText !== 'string' || sourceText.trim() === '') {
    return {
      text: sourceText || '',
      cached: false,
      provider: 'none',
      sourceHash: computeSourceHash(''),
    };
  }

  // 3. Length validation
  if (sourceText.length > config.limits.maxTextLength) {
    throw new ValidationError(
      `Source text exceeds maximum limit of ${config.limits.maxTextLength} characters (received ${sourceText.length}).`,
      { code: TRANSLATION_ERROR_CODES.TEXT_TOO_LONG },
    );
  }

  // 4. Same-language optimization: return unchanged without calling DB or Google
  if (srcLang === tgtLang) {
    return {
      text: sourceText,
      cached: false,
      provider: 'none',
      bypassed: true,
      sourceHash: computeSourceHash(sourceText),
    };
  }

  // 5. Compute source hash & cache key
  const sourceHash = computeSourceHash(sourceText);
  const cacheKey = computeCacheKey({
    contentType,
    contentId,
    fieldName,
    sourceLanguage: srcLang,
    targetLanguage: tgtLang,
    sourceHash,
    provider: config.providerName,
    version: config.version,
    scope,
  });

  // 6. Check MySQL cache
  let cachedEntry = null;
  try {
    cachedEntry = await TranslationCache.findOne({ where: { cacheKey } });
  } catch (dbError) {
    // If DB is temporarily unavailable in non-production, log warning and proceed to translate
    console.warn('[TranslationService] Cache lookup error:', dbError.message);
  }

  if (cachedEntry) {
    stats.cacheHits++;
    return {
      text: cachedEntry.translatedText,
      cached: true,
      cacheKey,
      sourceHash,
      provider: cachedEntry.translationProvider,
      version: cachedEntry.translationVersion,
    };
  }

  stats.cacheMisses++;

  // 7. Feature flag check
  if (!config.enabled) {
    return {
      text: sourceText,
      cached: false,
      provider: 'fallback',
      disabled: true,
      sourceHash,
    };
  }

  // 8. Coalesce concurrent in-flight requests for the exact same cacheKey
  if (inflightRequests.has(cacheKey)) {
    return await inflightRequests.get(cacheKey);
  }

  const executionPromise = (async () => {
    // Check daily budget safeguard
    if (stats.charactersToday + sourceText.length > config.limits.dailyCharBudget) {
      stats.failedTranslations++;
      throw new AppError('Daily translation character budget exceeded.', {
        statusCode: 429,
        code: TRANSLATION_ERROR_CODES.BUDGET_EXCEEDED,
      });
    }

    try {
      const translatedText = await translateTextWithGoogle(
        { text: sourceText, sourceLanguage: srcLang, targetLanguage: tgtLang },
        { config, customClient },
      );

      // Persist to MySQL
      try {
        await TranslationCache.create({
          cacheKey,
          contentType,
          contentId: String(contentId),
          fieldName,
          sourceLanguage: srcLang,
          targetLanguage: tgtLang,
          sourceContentHash: sourceHash,
          translatedText,
          translationProvider: config.providerName,
          translationVersion: config.version,
          scope,
        });
      } catch (insertError) {
        // If concurrent insert occurred, ignore unique constraint error
        if (
          insertError.name !== 'SequelizeUniqueConstraintError' &&
          !insertError.message?.includes('Duplicate entry')
        ) {
          console.warn('[TranslationService] Failed to persist translation cache:', insertError.message);
        }
      }

      stats.successfulTranslations++;
      stats.totalCharactersTranslated += sourceText.length;
      stats.charactersToday += sourceText.length;

      return {
        text: translatedText,
        cached: false,
        cacheKey,
        sourceHash,
        provider: config.providerName,
        version: config.version,
      };
    } catch (googleError) {
      stats.failedTranslations++;
      throw googleError;
    }
  })();

  inflightRequests.set(cacheKey, executionPromise);

  try {
    return await executionPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

/**
 * Loads authoritative source text from database with strict authorization check.
 */
export async function loadAuthoritativeContent({
  contentType,
  contentId,
  fieldName,
  user = null,
  models,
  clientSourceText = '',
}) {
  const allowedFields = ALLOWED_TRANSLATABLE_FIELDS[contentType];
  if (!allowedFields) {
    throw new ValidationError(`Unsupported content type for translation: ${contentType}`, {
      code: TRANSLATION_ERROR_CODES.UNSUPPORTED_ENTITY,
    });
  }

  if (!allowedFields.includes(fieldName)) {
    throw new ValidationError(
      `Field '${fieldName}' is not allowed for translation on entity '${contentType}'.`,
      { code: TRANSLATION_ERROR_CODES.UNSUPPORTED_FIELD },
    );
  }

  const isPublic = PUBLIC_CONTENT_TYPES.has(contentType);
  const scope = isPublic ? 'public' : 'private';

  // Private content requires authenticated user
  if (!isPublic && !user) {
    throw new ForbiddenError('Authentication required to translate private content.', {
      code: TRANSLATION_ERROR_CODES.FORBIDDEN,
    });
  }

  let sourceRecord = null;
  let sourceText = '';

  switch (contentType) {
    case 'travel_guide_article': {
      sourceRecord = await models.TravelGuideArticle.findByPk(contentId);
      if (!sourceRecord && contentId) {
        sourceRecord = await models.TravelGuideArticle.findOne({ where: { slug: String(contentId) } });
      }
      break;
    }
    case 'travel_guide_destination': {
      sourceRecord = await models.TravelGuideDestination.findByPk(contentId);
      if (!sourceRecord && contentId) {
        sourceRecord = await models.TravelGuideDestination.findOne({ where: { slug: String(contentId) } });
      }
      break;
    }
    case 'travel_guide_region': {
      sourceRecord = await models.TravelGuideRegion.findByPk(contentId);
      if (!sourceRecord && contentId) {
        sourceRecord = await models.TravelGuideRegion.findOne({ where: { slug: String(contentId) } });
      }
      break;
    }
    case 'agency_profile': {
      sourceRecord = await models.AgencyProfile.findByPk(contentId);
      break;
    }
    case 'travel_request': {
      sourceRecord = await models.TravelRequest.findByPk(contentId);
      if (!sourceRecord) break;

      // Ownership and authorization verification
      if (user.role === 'admin') {
        // Admin has full visibility
      } else if (user.role === 'traveller') {
        if (sourceRecord.travellerId !== user.id) {
          throw new NotFoundError(); // Obscure existence
        }
      } else if (user.role === 'agency') {
        const agencyProfile = await models.AgencyProfile.findOne({ where: { userId: user.id } });
        if (!agencyProfile) throw new NotFoundError();

        // Check if matched
        const match = await models.TravelRequestAgency.findOne({
          where: { travelRequestId: contentId, agencyId: agencyProfile.id },
        });
        if (!match) throw new NotFoundError();
      } else {
        throw new NotFoundError();
      }
      break;
    }
    case 'quotation': {
      sourceRecord = await models.Quotation.findByPk(contentId, {
        include: [{ model: models.TravelRequest, as: 'travelRequest' }],
      });
      if (!sourceRecord) break;

      if (user.role === 'admin') {
        // Admin
      } else if (user.role === 'traveller') {
        if (sourceRecord.travelRequest?.travellerId !== user.id) {
          throw new NotFoundError();
        }
      } else if (user.role === 'agency') {
        const agencyProfile = await models.AgencyProfile.findOne({ where: { userId: user.id } });
        if (!agencyProfile || sourceRecord.agencyId !== agencyProfile.id) {
          throw new NotFoundError();
        }
      } else {
        throw new NotFoundError();
      }
      break;
    }
    case 'message': {
      sourceRecord = await models.Message.findByPk(contentId, {
        include: [{ model: models.Conversation, as: 'conversation' }],
      });
      if (!sourceRecord) break;

      const conversation = sourceRecord.conversation;
      if (!conversation) throw new NotFoundError();

      if (user.role === 'admin') {
        // Admin
      } else if (user.role === 'traveller') {
        if (conversation.travellerId !== user.id) {
          throw new NotFoundError();
        }
      } else if (user.role === 'agency') {
        const agencyProfile = await models.AgencyProfile.findOne({ where: { userId: user.id } });
        if (!agencyProfile || conversation.agencyId !== agencyProfile.id) {
          throw new NotFoundError();
        }
      } else {
        throw new NotFoundError();
      }
      break;
    }
    default:
      throw new ValidationError(`Unknown entity type: ${contentType}`);
  }

  if (!sourceRecord) {
    if (isPublic && clientSourceText && typeof clientSourceText === 'string') {
      return {
        sourceText: clientSourceText,
        scope,
        sourceLanguage: 'en',
      };
    }
    throw new NotFoundError(`Resource not found for ${contentType}:${contentId}`, {
      code: TRANSLATION_ERROR_CODES.NOT_FOUND,
    });
  }

  let effectiveField = fieldName;
  if (contentType === 'travel_guide_article') {
    if (fieldName === 'summary' && sourceRecord.summary === undefined) effectiveField = 'excerpt';
    if (fieldName === 'excerpt' && sourceRecord.excerpt === undefined) effectiveField = 'summary';
  } else if (contentType === 'travel_guide_destination') {
    if ((fieldName === 'tagline' || fieldName === 'summary') && sourceRecord.tagline === undefined) {
      effectiveField = sourceRecord.shortDescription ? 'shortDescription' : 'description';
    }
  } else if (contentType === 'agency_profile') {
    if (fieldName === 'bio' && sourceRecord.bio === undefined) effectiveField = 'description';
    if (fieldName === 'companyName' && sourceRecord.companyName === undefined) effectiveField = 'agencyName';
  }

  sourceText = sourceRecord[effectiveField] ?? sourceRecord[fieldName] ?? '';
  if (!sourceText && isPublic && clientSourceText && typeof clientSourceText === 'string') {
    sourceText = clientSourceText;
  }

  return {
    sourceText,
    scope,
    sourceLanguage: 'en', // Default canonical source language in DB
  };
}
