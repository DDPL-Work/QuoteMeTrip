/**
 * About Page (/about-us) — QuoteMeTrip.
 *
 * Concise, credible explanation of QuoteMeTrip's mission:
 * Route-first planning, competitive agency quotations, and transparent trip management.
 */

import { useI18n } from '@troublefree/i18n';
import { SectionHeading, CTASection } from '@troublefree/ui';
import { useAuth } from '../../features/auth/auth-context.js';
import { Icons } from '../../components/icons.jsx';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function AboutPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  usePageMetadata(
    'About QuoteMeTrip - Our Mission & Vision',
    'Empowering independent travellers to build custom multi-stop routes and connect with licensed local travel agencies in Turkey.',
  );

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: 'About Us' }]} />

      <SectionHeading
        title={t('about.title', 'About QuoteMeTrip')}
        subtitle={t(
          'about.subtitle',
          'Empowering travellers to build custom routes and connect with trusted local agencies.',
        )}
      />

      <div
        style={{ maxWidth: '48rem', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.8 }}
      >
        <p>
          <strong>QuoteMeTrip</strong> was built to solve a fundamental challenge in
          multi-stop travel planning: bridging the gap between a traveller's unique route vision and
          the local expertise required to execute it seamlessly without overpriced intermediaries.
        </p>

        <h3 style={{ fontSize: '1.4rem', marginTop: '2.5rem' }}>How We Help Travellers</h3>
        <ul className="tf-list" style={{ gap: '1rem', marginTop: '1rem' }}>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.MapPin aria-hidden="true" /> Route-First Itinerary Builder
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Map out custom multi-stop itineraries across Istanbul, Cappadocia, and the Turquoise Coast with automatic distance calculation and recommended day allocation.
            </p>
          </li>
          <li className="tf-card">
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Quotations aria-hidden="true" /> Competitive Agency Quotations
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Receive itemized offers directly from licensed local travel operators tailored to your
              specific travel requirements and budget.
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
              <Icons.Requests aria-hidden="true" /> Zero Platform Fees for Travellers
            </strong>
            <p className="tf-card-text" style={{ margin: '0.4rem 0 0' }}>
              Travellers never pay booking fees to QuoteMeTrip. You pay your chosen agency directly via their secure invoice.
            </p>
          </li>
        </ul>
      </div>

      <CTASection ctaHref={planTripHref} />
    </div>
  );
}

export default AboutPage;
