/**
 * Destinations List Page (/destinations) — QuoteMeTrip.
 *
 * Searchable & filterable destination directory with country links,
 * loading, empty, and error states.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, useBatchDynamicTranslation } from '@troublefree/i18n';
import { SectionHeading, DestinationCard } from '@troublefree/ui';
import { getDestinations } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function DestinationsPage() {
  const { t, locale } = useI18n();
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMetadata(
    t('destinations.title', 'Explore Destinations in Turkey'),
    t(
      'destinations.subtitle',
      'Discover inspiring destinations across Turkey including Istanbul, Cappadocia, Antalya, Pamukkale, and Ephesus. Build your custom travel route.',
    ),
  );

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

  const batchItems = useMemo(
    () =>
      destinations.flatMap((d) => [
        {
          contentType: 'travel_guide_destination',
          contentId: d.slug || d.id,
          fieldName: 'name',
          sourceText: d.name,
        },
        {
          contentType: 'travel_guide_destination',
          contentId: d.slug || d.id,
          fieldName: 'tagline',
          sourceText: d.tagline || d.description,
        },
      ]),
    [destinations],
  );

  const { translationsMap = {}, getTranslated } = useBatchDynamicTranslation({ items: batchItems });

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: t('header.destinations', 'Destinations') }]} />

      <SectionHeading
        title={t('destinations.title', 'Explore Destinations')}
        subtitle={t(
          'destinations.subtitle',
          'Discover inspiring places and start planning your custom travel route.',
        )}
      />

      {/* Featured Country Hub Banner */}
      <div
        className="tf-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.75rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(20, 125, 51, 0.08), rgba(245, 197, 24, 0.12))',
          border: '1px solid rgba(20, 125, 51, 0.2)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tf-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('destinations.featuredRegion', 'Featured Region')}
          </span>
          <h3 style={{ margin: '0.2rem 0', fontSize: '1.25rem' }}>
            {t('destinations.turkeyGuide', 'Turkey (Türkiye) Country Guide')}
          </h3>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--tf-text-muted)' }}>
            {t(
              'destinations.turkeyGuideDesc',
              'View national travel essentials, popular holiday circuits, and regional services.',
            )}
          </p>
        </div>
        <Link to="/destinations/turkey" className="tf-btn tf-btn-primary tf-btn-sm">
          {t('destinations.exploreTurkey', 'Explore Turkey Hub →')}
        </Link>
      </div>

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
          <option value="all">{t('destinations.allRegions', 'All Regions')}</option>
          <option value="marmara">{t('destinations.region.marmara', 'Marmara')}</option>
          <option value="central anatolia">{t('destinations.region.centralAnatolia', 'Central Anatolia')}</option>
          <option value="mediterranean">{t('destinations.region.mediterranean', 'Mediterranean')}</option>
          <option value="aegean">{t('destinations.region.aegean', 'Aegean')}</option>
          <option value="black sea">{t('destinations.region.blackSea', 'Black Sea')}</option>
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
          <p className="tf-card-text">{t('guide.adjustSearch', 'Try adjusting your search terms or filters.')}</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setRegion('all');
            }}
          >
            {t('guide.clearFilters', 'Clear Filters')}
          </button>
        </div>
      )}

      {!loading && !error && destinations.length > 0 && (
        <div className="tf-grid-3">
          {destinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              translatedName={getTranslated ? getTranslated('travel_guide_destination', dest.slug || dest.id, 'name', dest.name) : (translationsMap && translationsMap[`travel_guide_destination:${dest.slug || dest.id}:name`])}
              translatedTagline={getTranslated ? getTranslated('travel_guide_destination', dest.slug || dest.id, 'tagline', dest.tagline) : (translationsMap && translationsMap[`travel_guide_destination:${dest.slug || dest.id}:tagline`])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DestinationsPage;
