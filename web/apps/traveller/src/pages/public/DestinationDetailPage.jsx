/**
 * Destination Detail Page (/destinations/:slug) — Track B.
 *
 * Detailed view featuring hero image, location, description, highlights,
 * related travel guides, and a prominent "Plan a Trip to <Destination>" CTA.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getDestinationBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';

export function DestinationDetailPage() {
  const { slug } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getDestinationBySlug(slug);
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
  }, [slug]);

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
        <a href="/destinations" className="tf-btn tf-btn-primary">
          Back to Destinations
        </a>
      </div>
    );
  }

  const { destination, relatedGuides } = data;

  return (
    <div>
      {/* Destination Hero */}
      <section
        style={{
          position: 'relative',
          height: '24rem',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${destination.image})`,
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
          <p style={{ fontSize: '1.2rem', color: '#e2e8f0', margin: 0, maxWidth: '36rem' }}>
            {destination.tagline}
          </p>
        </div>
      </section>

      <div className="tf-public-container">
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
                  <strong>Country:</strong> {destination.country}
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
