/**
 * Destination Detail Page (/destinations/:countrySlug/:destinationSlug) — QuoteMeTrip.
 *
 * Detailed view featuring hero image, location, description, highlights,
 * relevant travel services, related travel guides, and a prominent "Plan a Trip to <Destination>" CTA.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getDestinationBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function DestinationDetailPage() {
  const params = useParams();
  const slug = params.destinationSlug || params.slug;
  const countrySlug = params.countrySlug || 'turkey';

  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getDestinationBySlug(slug, countrySlug);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Destination not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, countrySlug]);

  const destName = data?.destination?.name || 'Destination';
  usePageMetadata(
    `${destName} Travel Guide & Highlights`,
    data?.destination?.tagline || data?.destination?.description,
  );

  const planTripHref = user
    ? `/plan-trip?destination=${encodeURIComponent(destName)}`
    : `/login?redirect=${encodeURIComponent(`/plan-trip?destination=${destName}`)}`;

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !data?.destination) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>Destination Not Found</h2>
        <p className="tf-card-text">{error || 'The requested destination does not exist.'}</p>
        <Link to="/destinations" className="tf-btn tf-btn-primary">
          Back to Destinations
        </Link>
      </div>
    );
  }

  const { destination, relatedGuides, relevantServices } = data;

  return (
    <div>
      {/* Destination Hero */}
      <section
        style={{
          position: 'relative',
          height: '24rem',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.72)), url(${destination.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '3rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '75rem', width: '100%', margin: '0 auto' }}>
          <span
            className="tf-card-badge"
            style={{ position: 'static', marginBottom: '0.75rem', display: 'inline-block' }}
          >
            {destination.region}, {destination.country}
          </span>
          <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem', fontWeight: 800 }}>
            {destination.name}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#e2e8f0', margin: 0, maxWidth: '38rem' }}>
            {destination.tagline}
          </p>
        </div>
      </section>

      <div className="tf-public-container">
        <PublicBreadcrumbs
          items={[
            { label: 'Destinations', to: '/destinations' },
            { label: destination.country || 'Turkey', to: `/destinations/${destination.countrySlug || 'turkey'}` },
            { label: destination.name },
          ]}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.8rem', marginTop: 0 }}>Overview</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--tf-text)' }}>
              {destination.description}
            </p>

            <h3 style={{ fontSize: '1.4rem', marginTop: '2.5rem' }}>Popular Highlights & Places</h3>
            <ul className="tf-list" style={{ gap: '0.6rem' }}>
              {destination.popularPlaces.map((place) => (
                <li
                  key={place}
                  className="tf-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                  <strong>{place}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="tf-card" style={{ position: 'sticky', top: '5.5rem' }}>
              <h3 style={{ marginTop: 0 }}>Travel Information</h3>
              <div style={{ margin: '1rem 0', fontSize: '0.95rem' }}>
                <p>
                  <strong>Region:</strong> {destination.region}
                </p>
                <p>
                  <strong>Country:</strong>{' '}
                  <Link to={`/destinations/${destination.countrySlug || 'turkey'}`} style={{ color: 'var(--tf-primary)' }}>
                    {destination.country}
                  </Link>
                </p>
                <p>
                  <strong>Best Time to Visit:</strong> {destination.bestTimeToVisit}
                </p>
              </div>
              <a
                href={planTripHref}
                className="tf-btn tf-btn-primary"
                style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
              >
                {t('destinations.planCTA', 'Plan a Trip to')} {destination.name} →
              </a>
            </div>
          </div>
        </div>

        {/* Relevant Travel Services */}
        {relevantServices && relevantServices.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Available Travel Services in {destination.name}
            </h2>
            <p style={{ color: 'var(--tf-text-muted)', marginBottom: '1.5rem' }}>
              Add verified local services to your custom itinerary for {destination.name}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {relevantServices.map((svc) => (
                <div key={svc.id} className="tf-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{svc.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tf-text-muted)', margin: '0 0 1rem', flex: 1 }}>
                    {svc.tagline}
                  </p>
                  <Link to={`/travel-services/${svc.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm" style={{ alignSelf: 'flex-start' }}>
                    Service Details →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Guides */}
        {relatedGuides && relatedGuides.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
              Travel Guides for {destination.name}
            </h2>
            <div className="tf-grid-3">
              {relatedGuides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        <CTASection
          title={`Plan a Trip to ${destination.name}`}
          subtitle="Build your route including this destination and get custom agency quotations."
          ctaHref={planTripHref}
        />
      </div>
    </div>
  );
}

export default DestinationDetailPage;
