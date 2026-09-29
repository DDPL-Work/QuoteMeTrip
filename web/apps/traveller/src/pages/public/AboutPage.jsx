/**
 * About Page (/about) — Track B.
 *
 * Concise, credible explanation of Troublefree Holiday's mission:
 * Route-first planning, competitive agency quotations, and transparent trip management.
 */

import { useI18n } from '@troublefree/i18n';
import { SectionHeading, CTASection } from '@troublefree/ui';
import { useAuth } from '../../features/auth/auth-context.js';
import { Icons } from '../../components/icons.jsx';

export function AboutPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  return (
    <div className="tf-public-container">
      <SectionHeading
        title={t('about.title', 'About Troublefree Holiday')}
        subtitle={t(
          'about.subtitle',
          'Empowering travellers to build custom routes and connect with trusted local agencies.',
        )}
      />

      <div
        style={{ maxWidth: '48rem', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.8 }}
      >
        <p>
          <strong>Troublefree Holiday</strong> was built to solve a fundamental challenge in
          multi-stop travel planning: bridging the gap between a traveller's unique route vision and
          the local expertise required to execute it seamlessly.
        </p>

        <h3 style={{ fontSize: '1.4rem', marginTop: '2rem' }}>How We Help Travellers</h3>
        <ul className="tf-list" style={{ gap: '1rem', marginTop: '1rem' }}>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.MapPin aria-hidden="true" /> Route-First Itinerary Builder
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Map out custom multi-stop itineraries with automatic distance calculation and
              recommended day allocation.
            </p>
          </li>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Quotations aria-hidden="true" /> Competitive Agency Quotations
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Receive itemized offers directly from licensed local travel operators tailored to your
              specific travel requirements.
            </p>
          </li>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Messages aria-hidden="true" /> Secure Direct Messaging
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Chat directly with agency partners to adjust line items, refine itineraries, and
              confirm travel arrangements.
            </p>
          </li>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Requests aria-hidden="true" /> One Place to Manage Your Trip
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Accept your chosen quotation and track your job progress from booking to final
              completion.
            </p>
          </li>
        </ul>
      </div>

      <CTASection ctaHref={planTripHref} />
    </div>
  );
}
