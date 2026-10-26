/**
 * Translation API Controller.
 */
import { initModels } from '../../db/models/index.js';
import { getTranslationConfig } from '../../config/translation.js';
import { ValidationError } from '../../utils/errors.js';
import {
  getOrTranslate,
  loadAuthoritativeContent,
  getTranslationStats,
} from './translation.service.js';
import { TRANSLATION_ERROR_CODES } from './translation.constants.js';

export async function translateContent(req, res, next) {
  try {
    const {
      contentType,
      contentId,
      fieldName,
      targetLanguage = 'tr',
      sourceLanguage,
      sourceText: clientSourceText,
    } = req.body || {};

    if (!contentType || !contentId || !fieldName) {
      throw new ValidationError(
        'Missing required parameters: contentType, contentId, and fieldName are required.',
        { code: 'VALIDATION_ERROR' },
      );
    }

    const models = initModels();
    const { sourceText, scope, sourceLanguage: detectedSourceLang } =
      await loadAuthoritativeContent({
        contentType,
        contentId,
        fieldName,
        user: req.user || null,
        models,
        clientSourceText: typeof clientSourceText === 'string' ? clientSourceText : '',
      });

    const srcLang = sourceLanguage || detectedSourceLang || 'en';
    const result = await getOrTranslate({
      contentType,
      contentId: String(contentId),
      fieldName,
      sourceLanguage: srcLang,
      targetLanguage,
      sourceText,
      scope,
    });

    res.json({
      success: true,
      data: {
        contentType,
        contentId,
        fieldName,
        sourceLanguage: srcLang,
        targetLanguage,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function translateBatch(req, res, next) {
  try {
    const { items, targetLanguage = 'tr' } = req.body || {};
    const config = getTranslationConfig();

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Batch items array cannot be empty.', {
        code: 'VALIDATION_ERROR',
      });
    }

    if (items.length > config.limits.maxBatchItems) {
      throw new ValidationError(
        `Batch size exceeds maximum limit of ${config.limits.maxBatchItems} items.`,
        { code: TRANSLATION_ERROR_CODES.BATCH_TOO_LARGE },
      );
    }

    const models = initModels();
    let totalChars = 0;

    // Load authoritative records first and verify permissions
    const loadedItems = await Promise.all(
      items.map(async (item, index) => {
        const { contentType, contentId, fieldName, sourceLanguage } = item;
        if (!contentType || !contentId || !fieldName) {
          throw new ValidationError(
            `Item at index ${index} is missing required fields (contentType, contentId, fieldName).`,
          );
        }

        const authoritative = await loadAuthoritativeContent({
          contentType,
          contentId,
          fieldName,
          user: req.user || null,
          models,
          clientSourceText: typeof item.sourceText === 'string' ? item.sourceText : '',
        });

        totalChars += authoritative.sourceText.length;
        return {
          ...item,
          ...authoritative,
          sourceLanguage: sourceLanguage || authoritative.sourceLanguage || 'en',
          targetLanguage: item.targetLanguage || targetLanguage,
        };
      }),
    );

    if (totalChars > config.limits.maxBatchChars) {
      throw new ValidationError(
        `Total batch character count (${totalChars}) exceeds maximum limit of ${config.limits.maxBatchChars}.`,
        { code: TRANSLATION_ERROR_CODES.BATCH_TOO_LARGE },
      );
    }

    // Resolve translations (using cache or Google)
    const translatedResults = await Promise.all(
      loadedItems.map(async (item) => {
        const result = await getOrTranslate({
          contentType: item.contentType,
          contentId: String(item.contentId),
          fieldName: item.fieldName,
          sourceLanguage: item.sourceLanguage,
          targetLanguage: item.targetLanguage,
          sourceText: item.sourceText,
          scope: item.scope,
        });

        return {
          contentType: item.contentType,
          contentId: item.contentId,
          fieldName: item.fieldName,
          targetLanguage: item.targetLanguage,
          ...result,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        count: translatedResults.length,
        items: translatedResults,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function translateTransient(req, res, next) {
  try {
    const { text, sourceLanguage = 'en', targetLanguage = 'tr' } = req.body || {};
    const config = getTranslationConfig();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new ValidationError('Text parameter is required.', { code: 'VALIDATION_ERROR' });
    }

    if (text.length > config.limits.maxTransientLength) {
      throw new ValidationError(
        `Transient text exceeds limit of ${config.limits.maxTransientLength} characters.`,
        { code: TRANSLATION_ERROR_CODES.TEXT_TOO_LONG },
      );
    }

    const result = await getOrTranslate({
      contentType: 'transient',
      contentId: req.user ? String(req.user.id) : '0',
      fieldName: 'text',
      sourceLanguage,
      targetLanguage,
      sourceText: text,
      scope: 'private',
    });

    res.json({
      success: true,
      data: {
        sourceLanguage,
        targetLanguage,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export function getStats(_req, res) {
  res.json({
    success: true,
    data: getTranslationStats(),
  });
}
