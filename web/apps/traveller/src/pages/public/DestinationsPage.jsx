/**
 * Destinations List Page (/destinations) — Track B.
 *
 * Searchable & filterable destination grid with loading, empty, and error states.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, DestinationCard } from '@troublefree/ui';
import { getDestinations } from '../../services/public-api.js';

export function DestinationsPage() {
  const { t } = useI18n();
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await getDestinations({ search, region });
        if (active) setDestinations(list);
      } catch (err) {
        if (active) setError(err?.message || t('common.error', 'Failed to load content.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search, region, t]);

  return (
    <div className="tf-public-container">
      <SectionHeading
        title={t('destinations.title', 'Explore Destinations')}
        subtitle={t(
          'destinations.subtitle',
          'Discover inspiring places and start planning your custom travel route.',
        )}
      />

      <div className="tf-filter-bar">
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder={t(
            'destinations.searchPlaceholder',
            'Search destinations by name or region...',
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search destinations"
        />
        <select
          className="tf-input"
          style={{ width: 'auto' }}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Filter by region"
        >
          <option value="all">{t('common.all', 'All Regions')}</option>
          <option value="marmara">Marmara</option>
          <option value="central anatolia">Central Anatolia</option>
          <option value="mediterranean">Mediterranean</option>
          <option value="aegean">Aegean</option>
          <option value="black sea">Black Sea</option>
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

      {!loading && !error && destinations.length === 0 && (
        <div className="tf-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h3>{t('common.empty', 'No results found matching your query.')}</h3>
          <p className="tf-card-text">Try adjusting your search terms or filters.</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setRegion('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && destinations.length > 0 && (
        <div className="tf-grid-3">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      )}
    </div>
  );
}
