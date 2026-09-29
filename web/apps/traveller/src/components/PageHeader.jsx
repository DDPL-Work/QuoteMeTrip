import { Breadcrumbs } from './Breadcrumbs.jsx';

export function PageHeader({ title, subtitle, breadcrumbItems, actions }) {
  return (
    <header className="tf-portal-page-header">
      {breadcrumbItems ? <Breadcrumbs items={breadcrumbItems} /> : null}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {title ? <h1 className="tf-portal-page-title">{title}</h1> : null}
          {subtitle ? <p className="tf-portal-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: '10px' }}>{actions}</div> : null}
      </div>
    </header>
  );
}
