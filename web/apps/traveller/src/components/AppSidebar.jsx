import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiCompass,
  FiInbox,
  FiMessageSquare,
  FiBriefcase,
  FiUser,
  FiGlobe,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { useAuth } from '../features/auth/auth-context.js';
import { getMediaUrl } from '../lib/api.js';

export function AppSidebar({ badges = {}, onItemClick }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qmt_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qmt_sidebar_collapsed', String(next));
      } catch {
        // ignore storage access errors
      }
      return next;
    });
  };

  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // rendered outside provider fallback
  }

  const navSections = [
    {
      heading: 'WORKSPACE',
      items: [
        { label: 'Dashboard', to: '/app', exact: true, icon: FiGrid },
        { label: 'Plan My Trip', to: '/plan-trip', icon: FiCompass },
      ],
    },
    {
      heading: 'TRIPS',
      items: [
        { label: 'Travel Requests', to: '/travel-requests', badge: badges.requests, icon: FiInbox },
        { label: 'Messages', to: '/messages', badge: badges.messages, icon: FiMessageSquare },
        { label: 'Jobs', to: '/jobs', badge: badges.jobs, icon: FiBriefcase },
      ],
    },
    {
      heading: 'ACCOUNT',
      items: [
        { label: 'Profile', to: '/profile', icon: FiUser },
        { label: 'Public Portal', to: '/', icon: FiGlobe },
      ],
    },
  ];

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || user?.email?.split('@')[0] || 'Traveller';
  const rawAvatar = user?.profile?.profilePicture || user?.profile?.avatarUrl || user?.profilePicture || user?.avatarUrl || null;
  const avatarUrl = getMediaUrl(rawAvatar);
  const initials = (displayName[0] || 'T').toUpperCase();

  return (
    <aside
      className={`tf-portal-sidebar ${collapsed ? 'collapsed' : ''}`}
      aria-label="Portal Navigation"
      style={{
        width: collapsed ? '68px' : '240px',
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '12px 14px 6px',
        }}
      >
        {!collapsed && <div className="tf-portal-sidebar-caption" style={{ margin: 0 }}>NAVIGATION</div>}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'none',
            border: 'none',
            color: '#4E5754',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      <nav className="tf-portal-sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
        {navSections.map((sec) => (
          <div key={sec.heading} style={{ marginBottom: '12px' }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#717D79',
                  letterSpacing: '0.06em',
                  padding: '6px 14px 4px',
                }}
              >
                {sec.heading}
              </div>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="tf-portal-nav-item"
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '8px 14px',
                  }}
                >
                  {Icon && <Icon size={18} style={{ marginRight: collapsed ? 0 : '10px' }} />}
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {item.badge && item.badge > 0 ? (
                    <span
                      className="tf-portal-nav-badge"
                      style={{
                        position: collapsed ? 'absolute' : 'static',
                        top: collapsed ? '4px' : undefined,
                        right: collapsed ? '8px' : undefined,
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Traveller Profile Block */}
      <div
        style={{
          marginTop: 'auto',
          padding: collapsed ? '10px 6px' : '1rem',
          borderTop: '1px solid #E2DCD1',
          background: '#FBF9F5',
          borderRadius: '12px',
          margin: collapsed ? '8px 4px' : '1rem 0.75rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#147D33',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            flexShrink: 0,
          }}
          title={collapsed ? displayName : undefined}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            initials
          )}
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#13291C',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#147D33',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <FiCheckCircle size={11} /> Verified Traveller
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
