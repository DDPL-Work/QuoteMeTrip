/**
 * Travel Guide List Page (/travel-guide) — Track B.
 *
 * Searchable article grid for destination advice, itineraries, and tips.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, GuideCard } from '@troublefree/ui';
import { getTravelGuides } from '../../services/public-api.js';

export function TravelGuidePage() {
  const { t } = useI18n();
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <SectionHeading
        title={t('guide.title', 'Travel Guide')}
        subtitle={t(
          'guide.subtitle',
          'Handcrafted itineraries, regional insights, and essential travel tips.',
        )}
      />

      <div className="tf-filter-bar">
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder={t('guide.searchPlaceholder', 'Search travel articles...')}
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
          <option value="trip planning">Trip Planning</option>
          <option value="adventure">Adventure</option>
          <option value="beaches & nature">Beaches & Nature</option>
          <option value="culinary">Culinary</option>
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
