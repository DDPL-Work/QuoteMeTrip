/**
 * Country Destination Landing Page (/destinations/:countrySlug) — QuoteMeTrip.
 *
 * Dedicated country-level landing view with national overview, travel essentials,
 * destination directory, available services, and travel guides.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { DestinationCard, GuideCard, CTASection } from '@troublefree/ui';
import { getCountryBySlug } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';
import { useAuth } from '../../features/auth/auth-context.js';

export function CountryDestinationPage() {
  const { countrySlug } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const planTripHref = user
    ? `/plan-trip?country=${encodeURIComponent('Türkiye')}`
    : `/login?redirect=${encodeURIComponent('/plan-trip?country=Türkiye')}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getCountryBySlug(countrySlug);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Country not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [countrySlug]);

  const countryName = data?.country?.name || 'Destinations';
  usePageMetadata(
    `Destinations in ${countryName}`,
    data?.country?.tagline || 'Explore handcrafted destinations, custom routes, and verified agencies.',
  );

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !data?.country) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>Destination Region Not Found</h2>
        <p className="tf-card-text">{error || 'The requested country page does not exist.'}</p>
        <Link to="/destinations" className="tf-btn tf-btn-primary">
          Back to Destinations
        </Link>
      </div>
    );
  }

  const { country, destinations, guides, services } = data;

  return (
    <div>
      {/* Country Hero */}
      <section
        style={{
          position: 'relative',
          height: '24rem',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.75)), url(${country.heroImage})`,
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
            Country Landing
          </span>
          <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem', fontWeight: 800 }}>
            {country.name}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#e2e8f0', margin: 0, maxWidth: '42rem' }}>
            {country.tagline}
          </p>
        </div>
      </section>

      <div className="tf-public-container">
        <PublicBreadcrumbs
          items={[
            { label: 'Destinations', to: '/destinations' },
            { label: country.name },
          ]}
        />

        {/* Overview & Travel Essentials */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.8rem', marginTop: 0 }}>About {country.name}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--tf-text)' }}>
              {country.description}
            </p>

            <h3 style={{ fontSize: '1.4rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
              Why Travel with QuoteMeTrip in {country.name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="tf-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.35rem', color: 'var(--tf-primary)' }}>Route-First Planning</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-text-muted)' }}>
                  Chain multi-city routes across Istanbul, Cappadocia, and Aegean ruins with accurate transit times.
                </p>
              </div>
              <div className="tf-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.35rem', color: 'var(--tf-primary)' }}>Licensed Operators</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-text-muted)' }}>
                  Receive quotes only from government-verified Turkish travel agencies.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="tf-card" style={{ position: 'sticky', top: '5.5rem' }}>
              <h3 style={{ marginTop: 0 }}>Travel Essentials</h3>
              <div style={{ margin: '1rem 0', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p style={{ margin: 0 }}>
                  <strong>Currency:</strong> {country.travelInfo.currency}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Capital:</strong> {country.travelInfo.capital}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Languages:</strong> {country.travelInfo.languages}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Best Time to Visit:</strong> {country.travelInfo.bestTimeToVisit}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Gateways:</strong> {country.travelInfo.internationalAirports}
                </p>
              </div>
              <a
                href={planTripHref}
                className="tf-btn tf-btn-primary"
                style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box', marginTop: '1rem' }}
              >
                Plan a Trip in {country.name} →
              </a>
            </div>
          </div>
        </div>

        {/* Featured Destinations Grid */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Destinations in {country.name}</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--tf-text-muted)' }}>
                Select a destination to view local highlights, tours, and travel advice.
              </p>
            </div>
          </div>
          <div className="tf-grid-3">
            {destinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        </section>

        {/* Available Travel Services */}
        {services && services.length > 0 && (
          <section style={{ marginBottom: '4rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Travel Services in {country.name}</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--tf-text-muted)' }}>
                Professional services provided by verified local operators.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {services.map((svc) => (
                <div key={svc.id} className="tf-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{svc.name}</h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', color: 'var(--tf-text-muted)', flex: 1 }}>
                    {svc.summary}
                  </p>
                  <Link
                    to={`/travel-services/${svc.slug}`}
                    className="tf-btn tf-btn-ghost tf-btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    View Service Details →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Travel Guides */}
        {guides && guides.length > 0 && (
          <section style={{ marginBottom: '4rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Travel Guides & Route Advice</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--tf-text-muted)' }}>
                Insights and itineraries written by regional travel specialists.
              </p>
            </div>
            <div className="tf-grid-3">
              {guides.slice(0, 3).map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        <CTASection
          title={`Ready to Visit ${country.name}?`}
          subtitle="Build your route across Turkey and receive itemized quotations from verified local agencies."
          ctaHref={planTripHref}
        />
      </div>
    </div>
  );
}

export default CountryDestinationPage;
