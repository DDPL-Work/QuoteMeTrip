/**
 * Translation Unit & Security Tests.
 *
 * Covers:
 * 1. Valid cache hit returns saved translation and makes 0 Google calls.
 * 2. Cache miss calls Google once and stores translation.
 * 3. The same content, same target language, and same version reuse the cache.
 * 4. Changed source content produces a new source hash and does not return stale text.
 * 5. English-to-English (or same language) returns original content without calling Google.
 * 6. English-to-Turkish and Turkish-to-English calls use correct language codes.
 * 7. Concurrent identical requests avoid duplicate Google API calls (request coalescing).
 * 8. A Google failure is not saved as a successful translation.
 * 9. Unsupported languages are rejected.
 * 10. Oversized text is rejected.
 * 11. Unauthorized users cannot translate private records or access cached results.
 * 12. Sensitive fields and non-translatable structured fields are rejected.
 * 13. Missing Google credentials provide clear configuration guidance.
 * 14. The feature flag disables external calls while returning safe fallback.
 * 15. Observability metrics and character tracking work correctly.
 */
import assert from 'node:assert';
import { describe, test, beforeEach, afterEach } from 'node:test';
import {
  computeSourceHash,
  computeCacheKey,
  getOrTranslate,
  loadAuthoritativeContent,
  getTranslationStats,
  resetTranslationStats,
} from '../../src/modules/translation/translation.service.js';
import {
  TRANSLATION_ERROR_CODES,
} from '../../src/modules/translation/translation.constants.js';
import { getTranslationClient } from '../../src/integrations/google-translation.js';
import { TranslationCache } from '../../src/db/models/index.js';

describe('Translation Service & Cache Tests', () => {
  let mockDbStore;
  let originalFindOne;
  let originalCreate;
  let googleCallLog;
  let mockGoogleClient;

  beforeEach(() => {
    resetTranslationStats();
    mockDbStore = new Map();
    googleCallLog = [];

    // Mock Google Translation client
    mockGoogleClient = {
      translateText: async (req) => {
        googleCallLog.push(req);
        const text = req.contents[0];
        const src = req.sourceLanguageCode;
        const tgt = req.targetLanguageCode;
        return [
          {
            translations: [
              {
                translatedText: `[TRANSLATED:${src}->${tgt}]: ${text}`,
              },
            ],
          },
        ];
      },
    };

    // Mock TranslationCache methods
    originalFindOne = TranslationCache.findOne;
    originalCreate = TranslationCache.create;

    TranslationCache.findOne = async ({ where }) => {
      const row = mockDbStore.get(where.cacheKey);
      return row || null;
    };

    TranslationCache.create = async (values) => {
      mockDbStore.set(values.cacheKey, {
        id: mockDbStore.size + 1,
        ...values,
      });
      return mockDbStore.get(values.cacheKey);
    };
  });

  afterEach(() => {
    TranslationCache.findOne = originalFindOne;
    TranslationCache.create = originalCreate;
  });

  test('1. Valid cache hit returns saved translation and makes 0 Google calls', async () => {
    const sourceText = 'Welcome to Cappadocia';
    const sourceHash = computeSourceHash(sourceText);
    const cacheKey = computeCacheKey({
      contentType: 'travel_guide_destination',
      contentId: '1',
      fieldName: 'name',
      sourceLanguage: 'en',
      targetLanguage: 'tr',
      sourceHash,
      provider: 'google_cloud_v3',
      version: 'v1',
      scope: 'public',
    });

    // Pre-populate MySQL cache
    mockDbStore.set(cacheKey, {
      cacheKey,
      translatedText: 'Kapadokya’ya Hoş Geldiniz',
      translationProvider: 'google_cloud_v3',
      translationVersion: 'v1',
    });

    const result = await getOrTranslate(
      {
        contentType: 'travel_guide_destination',
        contentId: '1',
        fieldName: 'name',
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        sourceText,
        scope: 'public',
      },
      { customClient: mockGoogleClient },
    );

    assert.strictEqual(result.cached, true);
    assert.strictEqual(result.text, 'Kapadokya’ya Hoş Geldiniz');
    assert.strictEqual(googleCallLog.length, 0, 'Google must NOT be called on a cache hit');

    const stats = getTranslationStats();
    assert.strictEqual(stats.cacheHits, 1);
    assert.strictEqual(stats.cacheMisses, 0);
  });

  test('2. Cache miss calls Google once and stores translation in MySQL', async () => {
    const sourceText = 'Explore ancient caves and fairy chimneys.';

    const result = await getOrTranslate(
      {
        contentType: 'travel_guide_destination',
        contentId: '1',
        fieldName: 'description',
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        sourceText,
        scope: 'public',
      },
      { customClient: mockGoogleClient },
    );

    assert.strictEqual(result.cached, false);
    assert.strictEqual(googleCallLog.length, 1);
    assert.strictEqual(result.text, `[TRANSLATED:en->tr]: ${sourceText}`);

    // Verify persisted in cache
    const cachedRow = mockDbStore.get(result.cacheKey);
    assert.ok(cachedRow, 'Translation must be persisted in translation_cache');
    assert.strictEqual(cachedRow.translatedText, result.text);
    assert.strictEqual(cachedRow.sourceContentHash, computeSourceHash(sourceText));

    const stats = getTranslationStats();
    assert.strictEqual(stats.cacheMisses, 1);
    assert.strictEqual(stats.successfulTranslations, 1);
  });

  test('3. Same content, target language, and version reuses cache on second request', async () => {
    const sourceText = 'Pamukkale thermal terraces.';
    const params = {
      contentType: 'travel_guide_destination',
      contentId: '2',
      fieldName: 'name',
      sourceLanguage: 'en',
      targetLanguage: 'tr',
      sourceText,
      scope: 'public',
    };

    // First request: Miss
    const res1 = await getOrTranslate(params, { customClient: mockGoogleClient });
    assert.strictEqual(res1.cached, false);
    assert.strictEqual(googleCallLog.length, 1);

    // Second request: Hit
    const res2 = await getOrTranslate(params, { customClient: mockGoogleClient });
    assert.strictEqual(res2.cached, true);
    assert.strictEqual(res2.text, res1.text);
    assert.strictEqual(googleCallLog.length, 1, 'Google call count must remain 1');
  });

  test('4. Changed source content produces new source hash and does not return stale text', async () => {
    const params = {
      contentType: 'travel_guide_article',
      contentId: '5',
      fieldName: 'title',
      sourceLanguage: 'en',
      targetLanguage: 'tr',
      scope: 'public',
    };

    const res1 = await getOrTranslate(
      { ...params, sourceText: 'Original Guide Title' },
      { customClient: mockGoogleClient },
    );
    assert.strictEqual(googleCallLog.length, 1);

    // Edit content
    const res2 = await getOrTranslate(
      { ...params, sourceText: 'Updated Guide Title with New Tips' },
      { customClient: mockGoogleClient },
    );

    assert.strictEqual(googleCallLog.length, 2, 'Google must be called for new content');
    assert.notStrictEqual(res1.sourceHash, res2.sourceHash);
    assert.notStrictEqual(res1.cacheKey, res2.cacheKey);
    assert.strictEqual(res2.text, '[TRANSLATED:en->tr]: Updated Guide Title with New Tips');
  });

  test('5. Same source and target language returns original content without Google call', async () => {
    const original = 'Already in English';
    const result = await getOrTranslate(
      {
        sourceLanguage: 'en',
        targetLanguage: 'en',
        sourceText: original,
      },
      { customClient: mockGoogleClient },
    );

    assert.strictEqual(result.text, original);
    assert.strictEqual(result.bypassed, true);
    assert.strictEqual(googleCallLog.length, 0);
  });

  test('6. English-to-Turkish and Turkish-to-English use correct language codes', async () => {
    // en -> tr
    await getOrTranslate(
      {
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        sourceText: 'Hello',
      },
      { customClient: mockGoogleClient },
    );
    assert.strictEqual(googleCallLog[0].sourceLanguageCode, 'en');
    assert.strictEqual(googleCallLog[0].targetLanguageCode, 'tr');

    // tr -> en
    await getOrTranslate(
      {
        sourceLanguage: 'tr',
        targetLanguage: 'en',
        sourceText: 'Merhaba',
      },
      { customClient: mockGoogleClient },
    );
    assert.strictEqual(googleCallLog[1].sourceLanguageCode, 'tr');
    assert.strictEqual(googleCallLog[1].targetLanguageCode, 'en');
  });

  test('7. Concurrent identical requests avoid duplicate Google API calls via request coalescing', async () => {
    let googleExecutionCount = 0;
    const slowMockClient = {
      translateText: async (_req) => {
        googleExecutionCount++;
        // Simulate asynchronous network latency
        await new Promise((resolve) => setTimeout(resolve, 50));
        return [
          {
            translations: [{ translatedText: 'Eşzamanlı Çeviri' }],
          },
        ];
      },
    };

    const params = {
      contentType: 'travel_guide_article',
      contentId: '99',
      fieldName: 'summary',
      sourceLanguage: 'en',
      targetLanguage: 'tr',
      sourceText: 'Simultaneous identical request test',
    };

    // 5 concurrent requests for the same uncached field
    const results = await Promise.all([
      getOrTranslate(params, { customClient: slowMockClient }),
      getOrTranslate(params, { customClient: slowMockClient }),
      getOrTranslate(params, { customClient: slowMockClient }),
      getOrTranslate(params, { customClient: slowMockClient }),
      getOrTranslate(params, { customClient: slowMockClient }),
    ]);

    assert.strictEqual(googleExecutionCount, 1, 'Google API should be called exactly once');
    for (const res of results) {
      assert.strictEqual(res.text, 'Eşzamanlı Çeviri');
    }
  });

  test('8. Google failure is not saved as a successful translation', async () => {
    const failingClient = {
      translateText: async () => {
        throw new Error('503 Service Unavailable');
      },
    };

    await assert.rejects(
      async () => {
        await getOrTranslate(
          {
            sourceLanguage: 'en',
            targetLanguage: 'tr',
            sourceText: 'Fail me',
          },
          { customClient: failingClient },
        );
      },
      {
        message: /Google Translation API error/,
      },
    );

    assert.strictEqual(mockDbStore.size, 0, 'No failed entry should be saved in translation_cache');
    const stats = getTranslationStats();
    assert.strictEqual(stats.failedTranslations, 1);
  });

  test('9. Unsupported languages are rejected with ValidationError', async () => {
    await assert.rejects(
      async () => {
        await getOrTranslate(
          {
            sourceLanguage: 'de',
            targetLanguage: 'fr',
            sourceText: 'Guten Tag',
          },
          { customClient: mockGoogleClient },
        );
      },
      (err) => {
        assert.strictEqual(err.code, TRANSLATION_ERROR_CODES.INVALID_LANGUAGE);
        return true;
      },
    );
  });

  test('10. Oversized text is rejected', async () => {
    const hugeText = 'A'.repeat(5001);
    await assert.rejects(
      async () => {
        await getOrTranslate(
          {
            sourceLanguage: 'en',
            targetLanguage: 'tr',
            sourceText: hugeText,
          },
          { customClient: mockGoogleClient },
        );
      },
      (err) => {
        assert.strictEqual(err.code, TRANSLATION_ERROR_CODES.TEXT_TOO_LONG);
        return true;
      },
    );
  });

  test('11. Unauthorized users cannot translate private records or access cached results', async () => {
    const mockModels = {
      TravelRequest: {
        findByPk: async (id) => {
          if (id === '10') {
            return { id: 10, travellerId: 42, title: 'Private Honeymoon Itinerary' };
          }
          return null;
        },
      },
    };

    // Anonymous attempt on private record
    await assert.rejects(
      async () => {
        await loadAuthoritativeContent({
          contentType: 'travel_request',
          contentId: '10',
          fieldName: 'title',
          user: null, // anonymous
          models: mockModels,
        });
      },
      (err) => {
        assert.strictEqual(err.code, TRANSLATION_ERROR_CODES.FORBIDDEN);
        return true;
      },
    );

    // Wrong traveller attempt (ID 99 trying to view ID 42)
    await assert.rejects(
      async () => {
        await loadAuthoritativeContent({
          contentType: 'travel_request',
          contentId: '10',
          fieldName: 'title',
          user: { id: 99, role: 'traveller' },
          models: mockModels,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 404, 'Must 404 to avoid leaking private record existence');
        return true;
      },
    );

    // Authorized owner attempt
    const authContent = await loadAuthoritativeContent({
      contentType: 'travel_request',
      contentId: '10',
      fieldName: 'title',
      user: { id: 42, role: 'traveller' },
      models: mockModels,
    });
    assert.strictEqual(authContent.sourceText, 'Private Honeymoon Itinerary');
    assert.strictEqual(authContent.scope, 'private');
  });

  test('12. Sensitive fields and non-translatable structured fields are rejected', async () => {
    const mockModels = {
      AgencyProfile: {
        findByPk: async () => ({ id: 1, companyName: 'Travel Co', bankAccountIban: 'TR1234' }),
      },
    };

    // 'bankAccountIban' or non-allowlisted field
    await assert.rejects(
      async () => {
        await loadAuthoritativeContent({
          contentType: 'agency_profile',
          contentId: '1',
          fieldName: 'bankAccountIban',
          user: null,
          models: mockModels,
        });
      },
      (err) => {
        assert.strictEqual(err.code, TRANSLATION_ERROR_CODES.UNSUPPORTED_FIELD);
        return true;
      },
    );

    // Allowlisted field succeeds
    const allowed = await loadAuthoritativeContent({
      contentType: 'agency_profile',
      contentId: '1',
      fieldName: 'companyName',
      user: null,
      models: mockModels,
    });
    assert.strictEqual(allowed.sourceText, 'Travel Co');
  });

  test('13. Feature flag disables external calls while returning original source fallback', async () => {
    const disabledConfig = {
      enabled: false,
      supportedLanguages: ['en', 'tr'],
      providerName: 'google_cloud_v3',
      version: 'v1',
      limits: { maxTextLength: 5000, dailyCharBudget: 500000 },
    };

    const sourceText = 'Dynamic content when translation is off';
    const result = await getOrTranslate(
      {
        contentType: 'travel_guide_article',
        contentId: '1',
        fieldName: 'title',
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        sourceText,
      },
      { config: disabledConfig, customClient: mockGoogleClient },
    );

    assert.strictEqual(result.disabled, true);
    assert.strictEqual(result.text, sourceText);
    assert.strictEqual(googleCallLog.length, 0);
  });

  test('14. Missing credentials guidance is raised when file does not exist', () => {
    const missingConfig = {
      credentialsPath: '/non/existent/path/google-translation-sa.json',
      projectId: 'api-project-642772088722',
    };

    assert.throws(
      () => {
        getTranslationClient({ config: missingConfig });
      },
      (err) => {
        assert.ok(err.message.includes('/etc/quotemetrip/google-translation-sa.json'));
        return true;
      },
    );
  });

  test('15. Slug lookup fallback and field alias (summary -> excerpt) work correctly', async () => {
    const mockModels = {
      TravelGuideArticle: {
        findByPk: async (pk) => {
          if (pk === '1') return { id: 1, title: 'Article 1', excerpt: 'Excerpt 1' };
          return null; // string slug returns null on findByPk
        },
        findOne: async ({ where }) => {
          if (where.slug === 'istanbul-guide') {
            return { id: 1, slug: 'istanbul-guide', title: 'Istanbul Guide', excerpt: 'Istanbul Excerpt' };
          }
          return null;
        },
      },
    };

    // Slug lookup with 'summary' field mapping to 'excerpt'
    const result = await loadAuthoritativeContent({
      contentType: 'travel_guide_article',
      contentId: 'istanbul-guide',
      fieldName: 'summary',
      user: null,
      models: mockModels,
    });

    assert.strictEqual(result.sourceText, 'Istanbul Excerpt');
    assert.strictEqual(result.scope, 'public');
  });
});
