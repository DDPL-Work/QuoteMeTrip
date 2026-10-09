import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/**
 * PublicBreadcrumbs Component
 * Accessible breadcrumb navigation for QuoteMeTrip public website.
 */
export function PublicBreadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className="tf-portal-breadcrumbs"
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.45rem',
        fontSize: '0.875rem',
        color: 'var(--tf-text-muted, #64748b)',
        margin: '1rem 0 1.5rem',
      }}
    >
      <Link
        to="/"
        style={{
          color: 'var(--tf-primary, #147D33)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        Home
      </Link>
      {items.map((item, idx) => (
        <Fragment key={item.to || item.label || idx}>
          <span style={{ color: 'var(--tf-border, #cbd5e1)', userSelect: 'none' }}>/</span>
          {item.to ? (
            <Link
              to={item.to}
              style={{
                color: 'var(--tf-primary, #147D33)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              style={{
                color: 'var(--tf-text, #1e293b)',
                fontWeight: 600,
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
