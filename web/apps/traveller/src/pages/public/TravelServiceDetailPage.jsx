/**
 * Travel Service Detail Page (/travel-services/:serviceSlug) — QuoteMeTrip.
 *
 * Dedicated detail page for verified travel services:
 * - /travel-services/private-tours
 * - /travel-services/private-transfer
 * - /travel-services/minibus-with-driver
 * - /travel-services/guide
 * - /travel-services/hot-air-balloon
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { CTASection } from '@troublefree/ui';
import { getTravelServiceBySlug } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';
import { useAuth } from '../../features/auth/auth-context.js';

function getServiceName(svc, t) {
  if (!svc) return 'Travel Service';
  const map = {
    'private-tours': 'services.service.privateTours.name',
    'private-transfer': 'services.service.privateTransfer.name',
    'minibus-with-driver': 'services.service.minibusWithDriver.name',
    guide: 'services.service.guide.name',
    'hot-air-balloon': 'services.service.hotAirBalloon.name',
  };
  const key = map[svc.slug];
  return key ? t(key, svc.name) : svc.name;
}

function getServiceSummary(svc, t) {
  if (!svc) return '';
  const map = {
    'private-tours': 'services.service.privateTours.tagline',
    'private-transfer': 'services.service.privateTransfer.tagline',
    'minibus-with-driver': 'services.service.minibusWithDriver.tagline',
    guide: 'services.service.guide.tagline',
    'hot-air-balloon': 'services.service.hotAirBalloon.tagline',
  };
  const key = map[svc.slug];
  return key ? t(key, svc.summary || svc.tagline) : svc.summary || svc.tagline;
}

export function TravelServiceDetailPage() {
  const { serviceSlug } = useParams();
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
        const res = await getTravelServiceBySlug(serviceSlug);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Service not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [serviceSlug]);

  const service = data?.service;
  const serviceName = getServiceName(service, t);
  const serviceSummary = getServiceSummary(service, t);

  usePageMetadata(
    `${serviceName} in Turkey`,
    serviceSummary || data?.service?.tagline || data?.service?.summary,
  );

  const planTripHref = user
    ? `/plan-trip?service=${serviceSlug}`
    : `/login?redirect=${encodeURIComponent(`/plan-trip?service=${serviceSlug}`)}`;

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !data?.service) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>{t('common.empty', 'Service Not Found')}</h2>
        <p className="tf-card-text">{error || 'The requested travel service does not exist.'}</p>
        <Link to="/travel-services" className="tf-btn tf-btn-primary">
          {t('header.travelServices', 'Back to Travel Services')}
        </Link>
      </div>
    );
  }

  const { relatedDestinations } = data;

  return (
    <div>
      {/* Service Hero */}
      <section
        className="tf-detail-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.75)), url(${service.image})`,
        }}
      >
        <div className="tf-detail-hero-content">
          <span
            className="tf-card-badge"
            style={{ position: 'static', marginBottom: '0.75rem', display: 'inline-block' }}
          >
            {t('services.verifiedService', 'Verified Travel Service')}
          </span>
          <h1 className="tf-detail-hero-title">
            {serviceName}
          </h1>
          <p className="tf-detail-hero-tagline">
            {serviceSummary}
          </p>
        </div>
      </section>

      <div className="tf-public-container">
        <PublicBreadcrumbs
          items={[
            { label: t('header.travelServices', 'Travel Services'), to: '/travel-services' },
            { label: serviceName },
          ]}
        />

        <div className="tf-detail-grid">
          <div>
            <h2 style={{ fontSize: '1.8rem', marginTop: 0 }}>{t('services.overview', 'Overview')}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--tf-text)' }}>
              {service.summary}
            </p>

            <h3 style={{ fontSize: '1.4rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
              {t('services.inclusions', 'What Is Included')}
            </h3>
            <ul className="tf-list" style={{ gap: '0.75rem' }}>
              {service.inclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="tf-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.9rem 1.25rem',
                  }}
                >
                  <span style={{ color: 'var(--tf-primary, #147D33)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
                  <span style={{ fontSize: '0.95rem' }}>{item}</span>
                </li>
              ))}
            </ul>

            {service.highlights && (
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t('services.standards', 'Service Standards & Guarantees')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  {service.highlights.map((h, i) => (
                    <div key={i} className="tf-card" style={{ padding: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--tf-text)' }}>
                        ⭐️ {h}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="tf-card tf-sticky-sidebar">
              <h3 style={{ marginTop: 0 }}>{t('services.booking', 'Service Booking')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--tf-text-muted)' }}>
                {t(
                  'services.bookingSubtitle',
                  'Select this service when building your custom itinerary to receive competitive quotes from verified local agencies.',
                )}
              </p>

              <div style={{ margin: '1.25rem 0', padding: '0.75rem 0', borderTop: '1px solid var(--tf-border)', borderBottom: '1px solid var(--tf-border)' }}>
                <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                  {t('services.availableRegions', 'Available in Regions:')}
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {service.destinations.map((d) => (
                    <span
                      key={d}
                      style={{
                        fontSize: '0.82rem',
                        background: 'rgba(20, 125, 51, 0.08)',
                        color: 'var(--tf-primary)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={planTripHref}
                className="tf-btn tf-btn-primary"
                style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
              >
                {t('services.planWith', { name: serviceName }, `Plan Trip with ${serviceName} →`)}
              </a>
            </div>
          </div>
        </div>

        {/* Popular Destinations to Enjoy This Service */}
        {relatedDestinations && relatedDestinations.length > 0 && (
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              {t('services.popularFor', { name: serviceName }, `Popular Destinations for ${serviceName}`)}
            </h2>
            <p style={{ color: 'var(--tf-text-muted)', marginBottom: '1.5rem' }}>
              {t('services.popularForDesc', 'Explore destinations where this service is frequently requested.')}
            </p>
            <div className="tf-grid-3">
              {relatedDestinations.map((dest) => (
                <div key={dest.id} className="tf-destination-card">
                  <div className="tf-card-image-wrap">
                    <img src={dest.image} alt={dest.name} loading="lazy" className="tf-card-image" />
                    <span className="tf-card-badge">{dest.region}</span>
                  </div>
                  <div className="tf-card-content">
                    <h3>{dest.name}</h3>
                    <p className="tf-card-text">{dest.tagline}</p>
                    <Link
                      to={`/destinations/${dest.countrySlug || 'turkey'}/${dest.slug}`}
                      className="tf-btn tf-btn-ghost tf-btn-sm"
                    >
                      {t('common.explore', 'Explore')} {dest.name} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <CTASection
          title={t('services.bookWith', { name: serviceName }, `Book ${serviceName} with Verified Operators`)}
          subtitle={t('services.bookWithDesc', 'Submit your travel dates and requirements. Matched local operators will submit itemized quotes.')}
          ctaHref={planTripHref}
        />
      </div>
    </div>
  );
}

export default TravelServiceDetailPage;
