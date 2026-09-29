import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context.js';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', exact: true },
    { to: '/agencies', label: 'Agencies' },
    { to: '/memberships', label: 'Memberships' },
    { to: '/membership-plans', label: 'Membership Plans' },
    { to: '/commissions', label: 'Commissions' },
    { to: '/travel-requests', label: 'Travel Requests' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/audit-logs', label: 'Audit Logs' },
  ];

  return (
    <div
      className="admin-app-layout"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <header
        className="admin-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#23272B',
          color: '#FFFFFF',
          borderBottom: '2px solid #2E9E5B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            Troublefree <span style={{ color: '#F5C518' }}>Holiday</span>{' '}
            <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>ADMIN</small>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            {user?.email} <strong style={{ color: '#F5C518' }}>({user?.role})</strong>
          </span>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            style={{ color: '#FFFFFF', borderColor: '#555' }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <aside
          style={{
            width: '240px',
            background: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                color: isActive ? '#2E9E5B' : '#4A5568',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? '#F4F6F4' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main style={{ flex: 1, padding: '2rem', background: '#F4F6F4', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
