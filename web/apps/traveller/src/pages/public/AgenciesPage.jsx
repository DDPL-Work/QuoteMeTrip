/**
 * Agencies List Page (/agencies, /agencies/:locationSlug) — QuoteMeTrip.
 *
 * Searchable public agency directory exposing public-safe profiles only.
 * Supports filtering by country/location:
 * - /agencies
 * - /agencies/turkey
 * - /agencies/istanbul
 * - /agencies/cappadocia
 * Private contact details (email/phone/WhatsApp) are safely omitted.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n, useBatchDynamicTranslation } from '@troublefree/i18n';
import { SectionHeading, AgencyCard } from '@troublefree/ui';
import { getAgencies } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

const LOCATION_TITLES = {
  turkey: 'Turkey (Türkiye)',
  istanbul: 'Istanbul',
  cappadocia: 'Cappadocia',
  antalya: 'Antalya',
  izmir: 'Izmir',
};

export function AgenciesPage({ locationFilter }) {
  const params = useParams();
  const locationSlug = (params.locationSlug || locationFilter || '').toLowerCase();

  const { t, locale } = useI18n();
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');
  const [activeLocation, setActiveLocation] = useState(locationSlug || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (locationSlug) {
      setActiveLocation(locationSlug);
    }
  }, [locationSlug]);

  const locationDisplay = LOCATION_TITLES[activeLocation] || (activeLocation !== 'all' ? activeLocation : null);
  const pageTitle = locationDisplay
    ? `${t('agencies.verifiedIn', 'Verified Travel Agencies in')} ${locationDisplay}`
    : t('agencies.title', 'Verified Travel Agencies in Turkey');

  usePageMetadata(
    pageTitle,
    `Browse licensed, verified travel agencies in ${locationDisplay || 'Turkey'}. Receive competitive itemized quotes for custom holiday routes.`,
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await getAgencies({
          search,
          location: activeLocation !== 'all' ? activeLocation : '',
        });
        if (active) setAgencies(list);
      } catch (err) {
        if (active) setError(err?.message || t('common.error', 'Failed to load content.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search, activeLocation, t]);

  const batchItems = useMemo(
    () =>
      agencies.map((a) => ({
        contentType: 'agency_profile',
        contentId: a.id,
        fieldName: 'bio',
        sourceText: a.bio,
      })),
    [agencies],
  );

  const { translationsMap = {}, getTranslated } = useBatchDynamicTranslation({ items: batchItems });

  const breadcrumbs = [{ label: t('header.agencies', 'Agencies'), to: locationDisplay ? '/agencies' : undefined }];
  if (locationDisplay) {
    breadcrumbs.push({ label: locationDisplay });
  }

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={breadcrumbs} />

      <SectionHeading
        title={locationDisplay ? `${t('agencies.verifiedIn', 'Verified Travel Agencies in')} ${locationDisplay}` : t('agencies.title', 'Verified Travel Agencies')}
        subtitle={
          locationDisplay
            ? `${t('agencies.licensedIn', 'Licensed local travel operators based in')} ${locationDisplay} ${t('agencies.readyToPlan', 'ready to plan and execute your trip.')}`
            : t('agencies.subtitle', 'Browse verified local operators ready to provide custom trip quotations.')
        }
      />

      {/* Quick Location Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.75rem',
        }}
      >
        <Link
          to="/agencies"
          onClick={() => setActiveLocation('all')}
          className={`tf-btn ${activeLocation === 'all' ? 'tf-btn-primary' : 'tf-btn-ghost'} tf-btn-sm`}
        >
          {t('agencies.filter.all', 'All Locations')}
        </Link>
        <Link
          to="/agencies/turkey"
          onClick={() => setActiveLocation('turkey')}
          className={`tf-btn ${activeLocation === 'turkey' ? 'tf-btn-primary' : 'tf-btn-ghost'} tf-btn-sm`}
        >
          {t('agencies.filter.turkey', 'Turkey (All)')}
        </Link>
        <Link
          to="/agencies/istanbul"
          onClick={() => setActiveLocation('istanbul')}
          className={`tf-btn ${activeLocation === 'istanbul' ? 'tf-btn-primary' : 'tf-btn-ghost'} tf-btn-sm`}
        >
          {t('agencies.filter.istanbul', 'Istanbul')}
        </Link>
        <Link
          to="/agencies/cappadocia"
          onClick={() => setActiveLocation('cappadocia')}
          className={`tf-btn ${activeLocation === 'cappadocia' ? 'tf-btn-primary' : 'tf-btn-ghost'} tf-btn-sm`}
        >
          {t('agencies.filter.cappadocia', 'Cappadocia')}
        </Link>
      </div>

      <div className="tf-filter-bar">
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder={t('agencies.searchPlaceholder', 'Search agencies by name or specialty...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search travel agencies"
        />
        <select
          className="tf-input"
          style={{ width: 'auto' }}
          value={activeLocation}
          onChange={(e) => setActiveLocation(e.target.value)}
          aria-label="Filter by city"
        >
          <option value="all">{t('agencies.filter.all', 'All Locations')}</option>
          <option value="turkey">{t('agencies.filter.turkeyNationwide', 'Turkey (Nationwide)')}</option>
          <option value="istanbul">{t('agencies.filter.istanbul', 'Istanbul')}</option>
          <option value="antalya">{t('agencies.filter.antalya', 'Antalya')}</option>
          <option value="cappadocia">{t('agencies.filter.cappadociaNevsehir', 'Nevsehir (Cappadocia)')}</option>
          <option value="izmir">{t('agencies.filter.izmirAegean', 'Izmir (Aegean)')}</option>
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

      {!loading && !error && agencies.length === 0 && (
        <div className="tf-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h3>{t('common.empty', 'No results found matching your query.')}</h3>
          <p className="tf-card-text">{t('guide.adjustSearch', 'Try adjusting your search terms or filters.')}</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setActiveLocation('all');
            }}
          >
            {t('guide.clearFilters', 'Clear Filters')}
          </button>
        </div>
      )}

      {!loading && !error && agencies.length > 0 && (
        <div className="tf-grid-3">
          {agencies.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              translatedBio={getTranslated ? getTranslated('agency_profile', agency.id, 'bio', agency.bio) : (translationsMap && translationsMap[`agency_profile:${agency.id}:bio`])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AgenciesPage;
