/**
 * Travel Guide List Page (/travel-guides) — QuoteMeTrip.
 *
 * Searchable & filterable article directory for destination advice,
 * itineraries, and insider tips.
 */

import { useEffect, useState, useMemo } from 'react';
import { useI18n, useBatchDynamicTranslation } from '@troublefree/i18n';
import { SectionHeading, GuideCard } from '@troublefree/ui';
import { getTravelGuides } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function TravelGuidePage() {
  const { t, locale } = useI18n();
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMetadata(
    'Turkey Travel Guides & Itineraries',
    'Handcrafted travel guides for Turkey: Istanbul city advice, Cappadocia hot air balloon guides, Gallipoli battlefields, Pamukkale travertines, Ephesus ruins, and Antalya coast.',
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await getTravelGuides({ search, category });
        if (active) setGuides(list);
      } catch (err) {
        if (active) setError(err?.message || t('common.error', 'Failed to load content.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search, category, t]);

  const translationItems = useMemo(() => {
    const list = [];
    for (const guide of guides) {
      if (guide.title) {
        list.push({
          contentType: 'travel_guide_article',
          contentId: guide.id || guide.slug,
          fieldName: 'title',
          sourceText: guide.title,
        });
      }
      if (guide.summary) {
        list.push({
          contentType: 'travel_guide_article',
          contentId: guide.id || guide.slug,
          fieldName: 'summary',
          sourceText: guide.summary,
        });
      }
    }
    return list;
  }, [guides]);

  const { getTranslated } = useBatchDynamicTranslation({ items: translationItems });

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: t('header.travelGuides', 'Travel Guides') }]} />

      <SectionHeading
        title={t('guide.title', 'Travel Guides')}
        subtitle={t(
          'guide.subtitle',
          'Handcrafted itineraries, regional insights, and essential travel tips across Turkey.',
        )}
      />

      <div className="tf-filter-bar">
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder={t('guide.searchPlaceholder', 'Search travel articles by topic or destination...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('guide.searchPlaceholder', 'Search travel guides')}
        />
        <select
          className="tf-input"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">{t('guide.category.all', 'All Categories')}</option>
          <option value="city guide">{t('guide.category.cityGuide', 'City Guide')}</option>
          <option value="adventure">{t('guide.category.adventure', 'Adventure')}</option>
          <option value="history & culture">{t('guide.category.historyCulture', 'History & Culture')}</option>
          <option value="nature & heritage">{t('guide.category.natureHeritage', 'Nature & Heritage')}</option>
          <option value="archaeology">{t('guide.category.archaeology', 'Archaeology')}</option>
          <option value="coast & beaches">{t('guide.category.coastBeaches', 'Coast & Beaches')}</option>
        </select>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', padding: '3rem 0' }}>
          {t('common.loading', 'Loading...')}
        </p>
      )}

      {error && (
        <div className="tf-error" style={{ textAlign: 'center', margin: '2rem 0' }}>
          <p>{error}</p>
          <button type="button" className="tf-btn tf-btn-ghost" onClick={() => setSearch('')}>
            {t('common.retry', 'Try Again')}
          </button>
        </div>
      )}

      {!loading && !error && guides.length === 0 && (
        <div className="tf-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h3>{t('common.empty', 'No results found matching your query.')}</h3>
          <p className="tf-card-text">{t('guide.adjustSearch', 'Try adjusting your search terms or filters.')}</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
          >
            {t('guide.clearFilters', 'Clear Filters')}
          </button>
        </div>
      )}

      {!loading && !error && guides.length > 0 && (
        <div className="tf-grid-3">
          {guides.map((guide) => {
            const trTitle = getTranslated('travel_guide_article', guide.id || guide.slug, 'title', guide.title);
            const trSummary = getTranslated('travel_guide_article', guide.id || guide.slug, 'summary', guide.summary);

            return (
              <GuideCard
                key={guide.id}
                guide={guide}
                translatedTitle={trTitle}
                translatedSummary={trSummary}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TravelGuidePage;
