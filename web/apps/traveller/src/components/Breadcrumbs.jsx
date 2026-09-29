import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="tf-portal-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/app">Home</Link>
      {items.map((item, idx) => (
        <Fragment key={item.to || item.label || idx}>
          <span>/</span>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
