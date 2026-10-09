/**
 * Travel Guide List Page (/travel-guides) — QuoteMeTrip.
 *
 * Searchable & filterable article directory for destination advice,
 * itineraries, and insider tips.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, GuideCard } from '@troublefree/ui';
import { getTravelGuides } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function TravelGuidePage() {
  const { t } = useI18n();
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

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: 'Travel Guides' }]} />

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
          aria-label="Search travel guides"
        />
        <select
          className="tf-input"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">{t('common.all', 'All Categories')}</option>
          <option value="city guide">City Guide</option>
          <option value="adventure">Adventure</option>
          <option value="history & culture">History & Culture</option>
          <option value="nature & heritage">Nature & Heritage</option>
          <option value="archaeology">Archaeology</option>
          <option value="coast & beaches">Coast & Beaches</option>
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
          <p className="tf-card-text">Try adjusting your search terms or filters.</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && guides.length > 0 && (
        <div className="tf-grid-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TravelGuidePage;
