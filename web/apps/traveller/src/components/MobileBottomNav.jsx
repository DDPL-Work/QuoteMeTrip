import { NavLink, useLocation } from 'react-router-dom';
import { Icons } from './icons.jsx';

export function MobileBottomNav({ badges = {} }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <Icons.Dashboard aria-hidden="true" />, to: '/app', exact: true },
    { label: 'Plan', icon: <Icons.PlanTrip aria-hidden="true" />, to: '/plan-trip' },
    { label: 'Requests', icon: <Icons.Requests aria-hidden="true" />, to: '/travel-requests', badge: badges.requests },
    { label: 'Messages', icon: <Icons.Messages aria-hidden="true" />, to: '/messages', badge: badges.messages },
    { label: 'Profile', icon: <Icons.Profile aria-hidden="true" />, to: '/profile' },
  ];

  return (
    <nav className="tf-portal-mobile-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.to || location.pathname === '/dashboard'
          : location.pathname.startsWith(item.to);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="tf-portal-mobile-nav-item"
            aria-current={isActive ? 'page' : undefined}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="tf-portal-bell-badge" style={{ top: '2px', right: '12px' }}>
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
