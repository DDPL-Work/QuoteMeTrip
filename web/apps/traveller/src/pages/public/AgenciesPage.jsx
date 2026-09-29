/**
 * Agencies List Page (/agencies) — Track B.
 *
 * Searchable public agency directory exposing public-safe profiles only.
 * Private contact details (email/phone/WhatsApp) are safely omitted.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, AgencyCard } from '@troublefree/ui';
import { getAgencies } from '../../services/public-api.js';

export function AgenciesPage() {
  const { t } = useI18n();
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await getAgencies({ search, city });
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
  }, [search, city, t]);

  return (
    <div className="tf-public-container">
      <SectionHeading
        title={t('agencies.title', 'Verified Travel Agencies')}
        subtitle={t(
          'agencies.subtitle',
          'Browse verified local operators ready to provide custom trip quotations.',
        )}
      />

      <div className="tf-filter-bar">
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder={t('agencies.searchPlaceholder', 'Search agencies by name or city...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search travel agencies"
        />
        <select
          className="tf-input"
          style={{ width: 'auto' }}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Filter by city"
        >
          <option value="all">{t('common.all', 'All Cities')}</option>
          <option value="istanbul">Istanbul</option>
          <option value="antalya">Antalya</option>
          <option value="nevsehir">Nevsehir (Cappadocia)</option>
          <option value="izmir">Izmir</option>
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
          <p className="tf-card-text">Try adjusting your search terms or filters.</p>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => {
              setSearch('');
              setCity('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && agencies.length > 0 && (
        <div className="tf-grid-3">
          {agencies.map((agency) => (
            <AgencyCard key={agency.id} agency={agency} />
          ))}
        </div>
      )}
    </div>
  );
}
