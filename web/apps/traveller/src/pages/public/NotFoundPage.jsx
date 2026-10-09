/**
 * NotFoundPage (404) — QuoteMeTrip Public Website.
 *
 * Dedicated Not Found page with helpful quick links and clear feedback.
 */

import { Link } from 'react-router-dom';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function NotFoundPage() {
  usePageMetadata('404 Page Not Found', 'The requested page could not be found on QuoteMeTrip.');

  return (
    <div className="tf-public-container" style={{ padding: '3rem 1.5rem 5rem' }}>
      <PublicBreadcrumbs items={[{ label: '404 Not Found' }]} />

      <div
        className="tf-card"
        style={{
          maxWidth: '42rem',
          margin: '2rem auto',
          textAlign: 'center',
          padding: '4rem 2rem',
        }}
      >
        <span
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            color: 'var(--tf-primary, #147D33)',
            lineHeight: 1,
            display: 'block',
            marginBottom: '1rem',
          }}
        >
          404
        </span>
        <h1 style={{ fontSize: '2rem', margin: '0 0 1rem', color: 'var(--tf-text, #1e293b)' }}>
          Page Not Found
        </h1>
        <p
          style={{
            color: 'var(--tf-text-muted, #64748b)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: '30rem',
            margin: '0 auto 2.5rem',
          }}
        >
          We couldn't find the page you're looking for. The link may be broken or the URL might have moved to our new structure.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <Link to="/" className="tf-btn tf-btn-primary">
            Back to Home
          </Link>
          <Link to="/destinations" className="tf-btn tf-btn-ghost">
            Explore Destinations
          </Link>
          <Link to="/travel-services" className="tf-btn tf-btn-ghost">
            Travel Services
          </Link>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--tf-border, #e2e8f0)',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          <Link to="/travel-guides" style={{ color: 'var(--tf-primary)' }}>
            Travel Guides
          </Link>
          <Link to="/agencies" style={{ color: 'var(--tf-primary)' }}>
            Travel Agencies
          </Link>
          <Link to="/how-it-works" style={{ color: 'var(--tf-primary)' }}>
            How It Works
          </Link>
          <Link to="/contact" style={{ color: 'var(--tf-primary)' }}>
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
