/**
 * Travel Services Directory Page (/travel-services) — QuoteMeTrip.
 *
 * Showcases the 5 verified travel service offerings:
 * Private Tours, Private Transfers, Minibus with Driver, Licensed Guides, and Hot Air Balloons.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, CTASection } from '@troublefree/ui';
import { getTravelServices } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';
import { useAuth } from '../../features/auth/auth-context.js';

export function TravelServicesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  usePageMetadata(
    'Travel Services in Turkey',
    'Explore verified travel services in Turkey: private tours, airport transfers, minibus with driver, licensed tour guides, and Cappadocia hot air balloon flights.',
  );

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getTravelServices({ search });
        if (active) setServices(list);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search]);

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: 'Travel Services' }]} />

      <SectionHeading
        title="Travel Services in Turkey"
        subtitle="Customizable services delivered by licensed, verified local travel agencies."
      />

      <div className="tf-filter-bar" style={{ maxWidth: '36rem', margin: '0 auto 2.5rem' }}>
        <input
          type="text"
          className="tf-input tf-search-input"
          placeholder="Search travel services (tours, transfer, guide, balloon)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search travel services"
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem 0' }}>
          {t('common.loading', 'Loading...')}
        </p>
      ) : services.length === 0 ? (
        <div className="tf-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h3>No travel services matched your search.</h3>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => setSearch('')}
            style={{ marginTop: '1rem' }}
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="tf-grid-3" style={{ marginBottom: '4rem' }}>
          {services.map((svc) => (
            <div
              key={svc.id}
              className="tf-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 'var(--tf-radius-md, 12px)',
                padding: 0,
              }}
            >
              <div style={{ height: '12rem', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={svc.image}
                  alt={svc.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <span
                  className="tf-card-badge"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'var(--tf-primary, #147D33)',
                    color: '#fff',
                  }}
                >
                  Verified Service
                </span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{svc.name}</h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', color: 'var(--tf-text-muted)', lineHeight: 1.6, flex: 1 }}>
                  {svc.summary}
                </p>

                <div style={{ margin: '0 0 1.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase' }}>
                    Popular Locations:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {svc.destinations.slice(0, 3).map((d) => (
                      <span
                        key={d}
                        style={{
                          fontSize: '0.8rem',
                          background: 'rgba(20, 125, 51, 0.08)',
                          color: 'var(--tf-primary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                  <Link
                    to={`/travel-services/${svc.slug}`}
                    className="tf-btn tf-btn-primary tf-btn-sm"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    View Details →
                  </Link>
                  <Link
                    to={`/plan-trip?service=${svc.slug}`}
                    className="tf-btn tf-btn-ghost tf-btn-sm"
                  >
                    Plan Trip
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CTASection
        title="Need Multiple Services for Your Route?"
        subtitle="Build your multi-day itinerary and select the services you need for each day. Matched agencies handle all bookings."
        ctaHref={planTripHref}
      />
    </div>
  );
}

export default TravelServicesPage;
