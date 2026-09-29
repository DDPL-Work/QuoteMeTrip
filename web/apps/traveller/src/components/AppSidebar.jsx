import { NavLink, useLocation } from 'react-router-dom';

export function AppSidebar({ badges = {} }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', to: '/app', exact: true },
    { label: 'Plan My Trip', to: '/plan-trip' },
    { label: 'Travel Requests', to: '/travel-requests', badge: badges.requests },
    { label: 'Messages', to: '/messages', badge: badges.messages },
    { label: 'Jobs', to: '/jobs', badge: badges.jobs },
    { label: 'Profile', to: '/profile' },
  ];

  return (
    <aside className="tf-portal-sidebar" aria-label="Portal Navigation">
      <div className="tf-portal-sidebar-caption">NAVIGATION</div>
      <nav className="tf-portal-sidebar-nav">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to || location.pathname === '/dashboard'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="tf-portal-nav-item"
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="tf-portal-nav-badge">{item.badge}</span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
