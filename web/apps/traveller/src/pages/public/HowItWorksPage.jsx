/**
 * How It Works Page (/how-it-works) — QuoteMeTrip.
 *
 * Dedicated public landing page detailing QuoteMeTrip's 3-step route-first
 * planning model, agency quoting process, payment security, and FAQ.
 */

import { Link } from 'react-router-dom';
import { SectionHeading, CTASection } from '@troublefree/ui';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';
import { JourneyStatusSection } from '../../components/home/JourneyStatusSection.jsx';
import { FaqSection } from '../../components/home/FaqSection.jsx';
import { useAuth } from '../../features/auth/auth-context.js';

export function HowItWorksPage() {
  const { user } = useAuth();
  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  usePageMetadata(
    'How QuoteMeTrip Works - Route-First Trip Planning',
    'Learn how QuoteMeTrip connects you with licensed local travel agencies in Turkey: build your custom route, receive competitive itemized quotes, and book with zero platform fees.',
  );

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: 'How It Works' }]} />

      <SectionHeading
        title="How QuoteMeTrip Works"
        subtitle="Three simple, transparent steps from your initial travel idea to a confirmed, paid-for holiday with zero traveller fees."
      />

      {/* 3 Steps Overview Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          margin: '2rem 0 4rem',
        }}
      >
        {/* Step 1 */}
        <div
          className="tf-card"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderTop: '4px solid var(--tf-primary, #147D33)',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--tf-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            STEP 1 · 5 MINUTES
          </span>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem' }}>
            Build your itinerary, day by day
          </h3>
          <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Choose Turkey, then specify dates and destinations for each day. Customize hotel class, vehicle needs, and tours — or let local agencies propose an optimal route.
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--tf-text)', lineHeight: 1.7 }}>
            <li>Add, remove, and reorder stops at your pace</li>
            <li>Specify private guides, drivers, or balloon rides</li>
            <li>Mention traveller count, baggage, and dietary needs</li>
            <li>Option to let agencies propose the complete route</li>
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link to={planTripHref} className="tf-btn tf-btn-ghost tf-btn-sm" style={{ width: '100%', textAlign: 'center' }}>
              Start Building Route →
            </Link>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className="tf-card"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderTop: '4px solid #F5C518',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#d97706',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            STEP 2 · 24–48 HOURS
          </span>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem' }}>
            Receive quotes from local agencies
          </h3>
          <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Your itinerary is broadcast exclusively to verified, licensed travel agencies in Turkey. They calculate total costs and return comprehensive itemized quotations.
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--tf-text)', lineHeight: 1.7 }}>
            <li>Side-by-side comparison of prices and inclusions</li>
            <li>Chat directly with operators to fine-tune details</li>
            <li>Agency contact info unlocks safely upon acceptance</li>
            <li>100% free for travellers — zero platform markup</li>
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link to={planTripHref} className="tf-btn tf-btn-ghost tf-btn-sm" style={{ width: '100%', textAlign: 'center' }}>
              How Quotes Work →
            </Link>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className="tf-card"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderTop: '4px solid #FC7C00',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#FC7C00',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            STEP 3 · SAME DAY
          </span>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem' }}>
            Agree, pay directly, get confirmed
          </h3>
          <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Accept your favored quotation. The agency provides their official secure payment link or bank invoice. You pay the agency directly with zero intermediary handling.
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--tf-text)', lineHeight: 1.7 }}>
            <li>Acceptance locks your price and closes competing bids</li>
            <li>Receive official booking voucher and PDF itinerary</li>
            <li>Direct phone, WhatsApp & email unlocked instantly</li>
            <li>Review and rate your agency after your journey</li>
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link to={planTripHref} className="tf-btn tf-btn-ghost tf-btn-sm" style={{ width: '100%', textAlign: 'center' }}>
              Plan My Trip →
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Photoband */}
      <div
        className="tf-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
          padding: '2.5rem',
          marginBottom: '4rem',
          background: 'linear-gradient(135deg, rgba(20, 125, 51, 0.05), rgba(252, 124, 0, 0.05))',
        }}
      >
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tf-primary)', textTransform: 'uppercase' }}>
            Real Local Expertise
          </span>
          <h2 style={{ fontSize: '1.9rem', margin: '0.5rem 0 1rem' }}>
            Every day planned. Every quote compared.
          </h2>
          <p style={{ color: 'var(--tf-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
            Unlike rigid packaged bus tours or opaque online travel agents, QuoteMeTrip puts you in the driver’s seat. You define the exact sequence of destinations and travel pacing. Local licensed agencies then bid against each other to deliver the best value and personal service.
          </p>
        </div>
        <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <img
            src="/images/how.png"
            alt="How QuoteMeTrip works"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Journey Status Section */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          Your Trip Status, From Start to Finish
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--tf-text-muted)', marginBottom: '2rem' }}>
          Real-time visibility into your quotation requests and booking stages.
        </p>
        <JourneyStatusSection />
      </div>

      {/* FAQs */}
      <div style={{ marginBottom: '4rem' }}>
        <FaqSection />
      </div>

      <CTASection
        title="Ready to Build Your Turkey Route?"
        subtitle="Take 5 minutes to set your itinerary and start receiving tailored quotes."
        ctaHref={planTripHref}
      />
    </div>
  );
}

export default HowItWorksPage;
