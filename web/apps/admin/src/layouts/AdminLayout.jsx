import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiUsers,
  FiCreditCard,
  FiLayers,
  FiDollarSign,
  FiMap,
  FiBriefcase,
  FiActivity,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
  FiShield,
  FiSidebar,
} from 'react-icons/fi';
import { useAuth } from '../features/auth/auth-context.js';
import { useI18n, SUPPORTED_LOCALES } from '@troublefree/i18n';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qmt_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const profileRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qmt_admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar like ChatGPT
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminName = user?.name || user?.email?.split('@')[0] || 'Admin';

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { key: 'dashboard', label: 'Dashboard', path: '/', exact: true, icon: FiGrid },
      ],
    },
    {
      title: 'AGENCY & PLANS',
      items: [
        { key: 'agencies', label: 'Agencies', path: '/agencies', icon: FiUsers },
        { key: 'memberships', label: 'Memberships', path: '/memberships', icon: FiCreditCard },
        {
          key: 'membership-plans',
          label: 'Membership Plans',
          path: '/membership-plans',
          icon: FiLayers,
        },
        { key: 'commissions', label: 'Commissions', path: '/commissions', icon: FiDollarSign },
      ],
    },
    {
      title: 'MARKETPLACE',
      items: [
        { key: 'travel-requests', label: 'Travel Requests', path: '/travel-requests', icon: FiMap },
        { key: 'jobs', label: 'Jobs', path: '/jobs', icon: FiBriefcase },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { key: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: FiActivity },
      ],
    },
  ];

  const currentPath = location.pathname;

  function isNavActive(item) {
    if (item.exact) return currentPath === '/';
    return currentPath.startsWith(item.path);
  }

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="admin-header-btn admin-mobile-toggle-btn"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <FiX /> : <FiMenu />}
          </button>

          {/* Desktop ChatGPT-style Sidebar Toggle */}
          <button
            type="button"
            className="admin-header-btn admin-desktop-toggle-btn"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            <FiSidebar />
          </button>

          <Link to="/" className="admin-header-brand">
            <img
              src="/images/tfh_logo.png"
              alt="QuoteMeTrip Admin"
              className="admin-brand-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="admin-brand-title">
              Quote<span style={{ color: '#FC7C00' }}>MyTrip</span>
            </span>
            <span className="admin-brand-badge">ADMIN</span>
          </Link>
        </div>

        <div className="admin-header-actions">
          {/* Notifications Button */}
          <button
            type="button"
            className="admin-header-btn"
            aria-label="Notifications"
            onClick={() => navigate('/audit-logs')}
            title="View Administrative Audit Logs"
          >
            <FiBell />
          </button>

          {/* Language Switcher */}
          <div className="tf-lang-switcher" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`tf-lang-btn ${locale === loc ? 'active' : ''}`}
                onClick={() => setLocale(loc)}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Profile Dropdown */}
          <div className="admin-profile-menu-container" ref={profileRef}>
            <button
              type="button"
              className="admin-profile-trigger"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
            >
              <div className="admin-avatar-circle">{adminName.charAt(0).toUpperCase()}</div>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {adminName}
              </span>
              <FiChevronDown style={{ fontSize: '0.9rem', opacity: 0.7 }} />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  className="admin-dropdown-menu"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                >
                  <div className="admin-dropdown-header">
                    <div className="admin-dropdown-name">QuoteMeTrip Admin</div>
                    <div className="admin-dropdown-email">{user?.email}</div>
                  </div>
                  <button
                    type="button"
                    className="admin-dropdown-item danger"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {/* Desktop Sidebar (Collapsible like ChatGPT) */}
        <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="admin-sidebar-scroll-area">
            {navSections.map((sec, secIdx) => (
              <div key={sec.title || secIdx} className="admin-nav-section">
                {!sidebarCollapsed && (
                  <div className="admin-nav-section-title">{sec.title}</div>
                )}
                <nav className="admin-nav-group" aria-label={sec.title}>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item);
                    return (
                      <NavLink
                        key={item.key}
                        to={item.path}
                        end={item.exact}
                        className={`admin-nav-item ${active ? 'active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="admin-nav-item-content">
                          <Icon className="admin-nav-item-icon" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </div>
                        {active && <span className="admin-nav-item-indicator" />}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {!sidebarCollapsed && (
            <div className="admin-sidebar-footer">
              <div className="admin-system-chip">
                <div className="admin-system-chip-title">QuoteMeTrip Operations</div>
                <div className="admin-system-chip-status">
                  <FiShield /> Verified System Admin
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Floating Expand Sidebar Button when collapsed on desktop (ChatGPT style) */}
        {sidebarCollapsed && (
          <button
            type="button"
            className="admin-floating-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
          >
            <FiSidebar />
            <span className="admin-floating-tooltip">Open sidebar (Ctrl+B)</span>
          </button>
        )}

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div
                className="admin-mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
              />
              <motion.aside
                className="admin-mobile-drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                      color: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        Quote<span style={{ color: '#FC7C00' }}>MyTrip</span>
                      </span>
                      <span className="admin-brand-badge">ADMIN</span>
                    </div>
                    <button
                      type="button"
                      className="admin-header-btn"
                      onClick={() => setMobileDrawerOpen(false)}
                      aria-label="Close menu"
                    >
                      <FiX />
                    </button>
                  </div>
                  {navSections.map((sec, secIdx) => (
                    <div key={sec.title || secIdx} className="admin-nav-section" style={{ marginBottom: '1rem' }}>
                      <div className="admin-nav-section-title">{sec.title}</div>
                      <nav className="admin-nav-group">
                        {sec.items.map((item) => {
                          const Icon = item.icon;
                          const active = isNavActive(item);
                          return (
                            <NavLink
                              key={item.key}
                              to={item.path}
                              end={item.exact}
                              className={`admin-nav-item ${active ? 'active' : ''}`}
                              onClick={() => setMobileDrawerOpen(false)}
                            >
                              <div className="admin-nav-item-content">
                                <Icon className="admin-nav-item-icon" />
                                <span>{item.label}</span>
                              </div>
                              {active && <span className="admin-nav-item-indicator" />}
                            </NavLink>
                          );
                        })}
                      </nav>
                    </div>
                  ))}
                </div>

                <div className="admin-sidebar-footer">
                  <div className="admin-system-chip">
                    <div className="admin-system-chip-title">QuoteMeTrip Operations</div>
                    <div className="admin-system-chip-status">
                      <FiShield /> Verified System Admin
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-dropdown-item danger"
                    style={{
                      color: '#FCA5A5',
                      background: 'rgba(239, 68, 68, 0.1)',
                      marginTop: '0.5rem',
                    }}
                    onClick={handleSignOut}
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className={`admin-main-content ${sidebarCollapsed ? 'expanded-panel' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="admin-page-container"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
