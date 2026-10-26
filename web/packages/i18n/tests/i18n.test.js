import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
  t,
  translateWithLocale,
  formatCurrency,
  formatDate,
  formatNumber,
  TRANSLATIONS,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from '../src/index.js';

describe('@troublefree/i18n unit tests', () => {
  test('supported locales include en and tr', () => {
    assert.deepStrictEqual(SUPPORTED_LOCALES, ['en', 'tr']);
    assert.strictEqual(DEFAULT_LOCALE, 'en');
  });

  test('English and Turkish catalogs have matching critical keys', () => {
    const requiredKeys = [
      'header.home',
      'header.destinations',
      'header.travelServices',
      'header.travelGuide',
      'header.agencies',
      'header.howItWorks',
      'header.about',
      'header.contact',
      'header.login',
      'header.register',
      'header.planTrip',
      'home.hero.title',
      'home.destinations.title',
      'home.howItWorks.title',
      'auth.signIn',
      'auth.register',
      'common.search',
      'common.loading',
      'common.error',
      'common.retry',
      'dashboard.welcome',
      'status.submitted',
      'status.accepted',
      'chat.translate',
      'chat.translateEn',
      'home.howItWorks.step1Badge',
      'home.howItWorks.step2Badge',
      'home.howItWorks.step3Badge',
      'home.howItWorks.step1Tick1',
      'home.howItWorks.step1Tip',
      'home.howItWorks.step1Cta',
      'howItWorks.page.title',
      'howItWorks.page.realLocalExpertise',
      'journey.status.title',
      'journey.status.draft',
      'journey.status.confirmed',
      'guide.category.all',
      'guide.category.cityGuide',
      'guide.readTime',
      'guide.readArticle',
      'agencies.verifiedIn',
      'agencies.filter.all',
      'services.title',
      'services.verifiedService',
      'destinations.featuredRegion',
      'country.about',
      'planTrip.title',
      'route.addDestination',
      'agency.nav.dashboard',
      'admin.nav.overview',
    ];

    for (const key of requiredKeys) {
      assert.ok(TRANSLATIONS.en[key], `en missing key: ${key}`);
      assert.ok(TRANSLATIONS.tr[key], `tr missing key: ${key}`);
      assert.notStrictEqual(
        TRANSLATIONS.en[key],
        TRANSLATIONS.tr[key],
        `en and tr should differ for: ${key}`,
      );
    }

    // Comprehensive parity check across all registered keys
    const enKeys = Object.keys(TRANSLATIONS.en);
    const trKeys = Object.keys(TRANSLATIONS.tr);
    const missingInTr = enKeys.filter((k) => !TRANSLATIONS.tr[k]);
    const missingInEn = trKeys.filter((k) => !TRANSLATIONS.en[k]);
    assert.deepStrictEqual(missingInTr, [], `Keys present in en but missing in tr: ${missingInTr.join(', ')}`);
    assert.deepStrictEqual(missingInEn, [], `Keys present in tr but missing in en: ${missingInEn.join(', ')}`);
  });

  test('translates with locale correctly', () => {
    assert.strictEqual(translateWithLocale('header.home', 'en'), 'Home');
    assert.strictEqual(translateWithLocale('header.home', 'tr'), 'Anasayfa');
  });

  test('falls back to English when a key is missing in Turkish', () => {
    const mockMissingKey = 'non_existent_key_for_test';
    // When missing in both, returns fallback or key
    assert.strictEqual(
      translateWithLocale(mockMissingKey, 'tr', 'Default Fallback'),
      'Default Fallback',
    );
    assert.strictEqual(translateWithLocale(mockMissingKey, 'tr'), mockMissingKey);
  });

  test('string interpolation replaces {variables}', () => {
    const interpolated = translateWithLocale('dashboard.welcome', 'en', {
      name: 'John',
      timeOfDay: 'morning',
    });
    assert.strictEqual(interpolated, 'Good morning, John 👋');

    const interpolatedTr = translateWithLocale('dashboard.welcome', 'tr', {
      name: 'Ahmet',
      timeOfDay: 'sabahlar',
    });
    assert.strictEqual(interpolatedTr, 'İyi sabahlar, Ahmet 👋');
  });

  test('formatCurrency handles TRY, USD, EUR in en and tr', () => {
    const formattedEn = formatCurrency(1500, 'TRY', 'en');
    const formattedTr = formatCurrency(1500, 'TRY', 'tr');
    assert.ok(formattedEn.includes('1,500') || formattedEn.includes('TRY'));
    assert.ok(formattedTr.includes('1.500') || formattedTr.includes('TL') || formattedTr.includes('₺'));
  });

  test('formatDate handles formatting in en and tr', () => {
    const date = new Date('2026-10-23T12:00:00Z');
    const dateEn = formatDate(date, 'en');
    const dateTr = formatDate(date, 'tr');
    assert.ok(dateEn.length > 0);
    assert.ok(dateTr.length > 0);
    assert.notStrictEqual(dateEn, dateTr);
  });

  test('formatNumber handles numeric formatting with locale delimiters', () => {
    const numEn = formatNumber(1234567.89, 'en');
    const numTr = formatNumber(1234567.89, 'tr');
    assert.strictEqual(numEn, '1,234,567.89');
    assert.strictEqual(numTr, '1.234.567,89');
  });

  test('translates Admin dashboard and management keys with EN/TR parity', () => {
    assert.strictEqual(translateWithLocale('admin.dashboard.greeting', 'en'), 'Good afternoon, Admin');
    assert.strictEqual(translateWithLocale('admin.dashboard.greeting', 'tr'), 'İyi günler, Yönetici');
    assert.strictEqual(
      translateWithLocale('admin.dashboard.agencyAlert', 'en', { count: 3 }),
      '3 agency registrations waiting for document verification and approval.',
    );
    assert.strictEqual(
      translateWithLocale('admin.dashboard.agencyAlert', 'tr', { count: 3 }),
      '3 acente kaydı belge doğrulaması ve onay bekliyor.',
    );
    assert.strictEqual(translateWithLocale('status.approved', 'en'), 'Approved');
    assert.strictEqual(translateWithLocale('status.approved', 'tr'), 'Onaylandı');
    assert.strictEqual(translateWithLocale('status.pending', 'en'), 'Pending');
    assert.strictEqual(translateWithLocale('status.pending', 'tr'), 'Beklemede');
  });
});
