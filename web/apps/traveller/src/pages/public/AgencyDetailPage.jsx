/**
 * Agency Detail Page (/agencies/:id) — QuoteMeTrip.
 *
 * Public-safe agency profile view. Exposes public metadata only.
 * NO private contact info (phone/email/WhatsApp) is displayed pre-acceptance.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { CTASection } from '@troublefree/ui';
import { getAgencyById } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function AgencyDetailPage({ agencyId }) {
  const params = useParams();
  const id = agencyId || params.id;

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
        const res = await getAgencyById(id);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Agency profile not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const agencyName = data?.agency?.agencyName || 'Agency Profile';
  usePageMetadata(
    `${agencyName} - Verified Travel Agency in ${data?.agency?.city || 'Turkey'}`,
    data?.agency?.bio || 'Verified travel agency on QuoteMeTrip.',
  );

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !data?.agency) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>Agency Not Found</h2>
        <p className="tf-card-text">{error || 'The requested agency profile does not exist.'}</p>
        <Link to="/agencies" className="tf-btn tf-btn-primary">
          Back to Agencies
        </Link>
      </div>
    );
  }

  const { agency } = data;

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs
        items={[
          { label: 'Agencies', to: '/agencies' },
          { label: agency.agencyName },
        ]}
      />

      <div className="tf-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <div className="tf-agency-header" style={{ marginBottom: '1.5rem' }}>
          <div
            className="tf-agency-avatar"
            style={{ width: '4rem', height: '4rem', fontSize: '1.8rem' }}
          >
            {agency.agencyName.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{agency.agencyName}</h1>
            <p className="tf-agency-location" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
              📍 {agency.city}, {agency.country} • Verified Travel Agency
            </p>
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>About the Agency</h3>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--tf-text-muted)' }}>
          {agency.bio}
        </p>

        {agency.specialties && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Specialties & Services</h4>
            <div className="tf-agency-chips">
              {agency.specialties.map((spec) => (
                <span
                  key={spec}
                  className="tf-chip"
                  style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {agency.languages && (
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>Spoken Languages</h4>
            <p style={{ margin: 0, color: 'var(--tf-text-muted)', fontSize: '0.95rem' }}>
              {agency.languages.join(', ')}
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--tf-border)',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', marginBottom: '1rem' }}>
            ℹ️ Direct contact details become available after accepting a quotation from this agency.
          </p>
          <a href={planTripHref} className="tf-btn tf-btn-primary tf-btn-lg">
            Plan Trip & Request Quotation →
          </a>
        </div>
      </div>

      <CTASection
        title="Ready to Request a Quotation?"
        subtitle="Build your route now and matched agencies will submit custom offers."
        ctaHref={planTripHref}
      />
    </div>
  );
}

export default AgencyDetailPage;
