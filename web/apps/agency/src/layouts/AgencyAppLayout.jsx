import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiInbox,
  FiFileText,
  FiMessageSquare,
  FiBriefcase,
  FiUser,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { useAuth } from '../features/auth/auth-context.js';
import { useI18n, SUPPORTED_LOCALES } from '@troublefree/i18n';
import { notificationApi } from '../lib/api.js';

export function AgencyAppLayout({ children, activeItem = null, unreadRequestsCount = 0 }) {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qmt_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qmt_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage quota or private-mode errors
      }
      return next;
    });
  };

  const isMessaging = location.pathname.includes('/messages');

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notifications count if API exists
  useEffect(() => {
    let active = true;
    async function checkNotifications() {
      try {
        if (notificationApi?.getUnreadCount) {
          try {
            const countRes = await notificationApi.getUnreadCount();
            if (active && countRes && typeof countRes.count === 'number') {
              setUnreadNotifications(countRes.count);
              return;
            }
          } catch {
            // fallback to list
          }
        }
        if (notificationApi?.list) {
          const res = await notificationApi.list({ unreadOnly: true, pageSize: 1 });
          if (active) {
            const count =
              res?.pagination?.totalItems ??
              res?.unreadCount ??
              res?.total ??
              (Array.isArray(res) ? res.length : 0);
            setUnreadNotifications(count);
          }
        }
      } catch {
        // notification endpoint optional fallback
      }
    }
    checkNotifications();
    return () => {
      active = false;
    };
  }, []);

  const agencyName =
    user?.agencyName ?? user?.companyName ?? user?.name ?? user?.email?.split('@')[0] ?? 'Agency';

  const navItems = [
    { key: 'dashboard', label: t('header.home', 'Dashboard'), path: '/', icon: FiGrid },
    {
      key: 'requests',
      label: t('dashboard.summary.requests', 'Incoming Requests'),
      path: '/requests',
      icon: FiInbox,
      badge: unreadRequestsCount > 0 ? unreadRequestsCount : null,
    },
    {
      key: 'quotations',
      label: t('dashboard.summary.quotations', 'My Quotations'),
      path: '/quotations',
      icon: FiFileText,
    },
    {
      key: 'messages',
      label: t('dashboard.summary.messages', 'Conversations'),
      path: '/messages',
      icon: FiMessageSquare,
    },
    {
      key: 'jobs',
      label: t('dashboard.summary.jobs', 'Accepted Jobs'),
      path: '/jobs',
      icon: FiBriefcase,
    },
    {
      key: 'profile',
      label: t('header.profile', 'Agency Profile'),
      path: '/profile',
      icon: FiUser,
    },
  ];

  const currentPath = location.pathname;

  function isNavActive(item) {
    if (activeItem) return activeItem === item.key;
    if (item.path === '/' && (currentPath === '/' || currentPath === '/dashboard')) return true;
    if (item.path !== '/' && currentPath.startsWith(item.path)) return true;
    return false;
  }

  return (
    <div className="agency-shell">
      {/* Header */}
      <header className="agency-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="agency-header-btn agency-mobile-toggle-btn"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link to="/" className="agency-header-brand">
            <img
              src="/images/tfh_logo.png"
              alt="QuoteMeTrip Agency"
              className="agency-brand-logo"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="agency-brand-badge">AGENCY</span>
          </Link>
        </div>

        <div className="agency-header-actions">
          {/* Notifications button */}
          <button
            type="button"
            className="agency-header-btn"
            onClick={() => navigate('/messages')}
            aria-label={`Notifications (${unreadNotifications} unread)`}
          >
            <FiBell />
            {unreadNotifications > 0 && (
              <span className="agency-badge-count">{unreadNotifications}</span>
            )}
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

          {/* Profile dropdown */}
          <div className="agency-profile-menu-container" ref={profileRef}>
            <button
              type="button"
              className="agency-profile-trigger"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
            >
              <div className="agency-avatar-circle">{agencyName.charAt(0).toUpperCase()}</div>
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
                {agencyName}
              </span>
              <FiChevronDown style={{ fontSize: '0.9rem', opacity: 0.7 }} />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  className="agency-dropdown-menu"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                >
                  <div className="agency-dropdown-header">
                    <div className="agency-dropdown-name">{agencyName}</div>
                    <div className="agency-dropdown-email">{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="agency-dropdown-item"
                    onClick={() => setProfileMenuOpen(false)}
                    role="menuitem"
                  >
                    <FiUser /> {t('header.profile', 'Agency Profile')}
                  </Link>
                  <button
                    type="button"
                    className="agency-dropdown-item danger"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    role="menuitem"
                  >
                    <FiLogOut /> {t('header.signOut', 'Sign Out')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="agency-body">
        {/* Desktop Fixed Sidebar */}
        <aside className={`agency-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: sidebarCollapsed ? '68px' : '240px', transition: 'width 0.2s ease', position: 'relative' }}>
          <div style={{ padding: '8px 12px 0', textAlign: sidebarCollapsed ? 'center' : 'right' }}>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#A3B8B0',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
              }}
            >
              {sidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>
          </div>
          <nav className="agency-nav-group" aria-label="Main Navigation">
            <div className="agency-sidebar-nav-section">
              {!sidebarCollapsed && <span className="agency-sidebar-nav-heading">WORKSPACE</span>}
              <Link
                to="/"
                className={`agency-nav-item ${isNavActive(navItems[0]) ? 'active' : ''}`}
                aria-current={isNavActive(navItems[0]) ? 'page' : undefined}
                title={sidebarCollapsed ? navItems[0].label : undefined}
              >
                <div className="agency-nav-item-content">
                  <FiGrid className="agency-nav-item-icon" />
                  {!sidebarCollapsed && <span>{navItems[0].label}</span>}
                </div>
              </Link>
            </div>

            <div className="agency-sidebar-nav-section" style={{ marginTop: '1.25rem' }}>
              {!sidebarCollapsed && <span className="agency-sidebar-nav-heading">OPERATIONS</span>}
              {navItems.slice(1, 5).map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`agency-nav-item ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="agency-nav-item-content">
                      <Icon className="agency-nav-item-icon" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {item.badge && <span className="agency-nav-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>

            <div className="agency-sidebar-nav-section" style={{ marginTop: '1.25rem' }}>
              {!sidebarCollapsed && <span className="agency-sidebar-nav-heading">ACCOUNT</span>}
              <Link
                to="/profile"
                className={`agency-nav-item ${isNavActive(navItems[5]) ? 'active' : ''}`}
                aria-current={isNavActive(navItems[5]) ? 'page' : undefined}
                title={sidebarCollapsed ? navItems[5].label : undefined}
              >
                <div className="agency-nav-item-content">
                  <FiUser className="agency-nav-item-icon" />
                  {!sidebarCollapsed && <span>{navItems[5].label}</span>}
                </div>
              </Link>
            </div>
          </nav>

          <div className="agency-sidebar-footer">
            <div className="agency-company-chip">
              {!sidebarCollapsed ? (
                <>
                  <div className="agency-company-chip-title">{agencyName}</div>
                  <div className="agency-company-chip-status">
                    <FiCheckCircle style={{ color: '#86efac' }} /> Verified Partner Agency
                  </div>
                  <div
                    style={{
                      marginTop: '0.4rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: user?.isMembershipActive === false ? '#fed7aa' : '#86efac',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '1rem',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: user?.isMembershipActive === false ? '#f97316' : '#22c55e',
                      }}
                    />
                    {user?.isMembershipActive === false ? 'Membership Pending' : 'Membership Active'}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }} title={agencyName}>
                  <FiCheckCircle style={{ color: '#86efac', fontSize: '1.2rem' }} />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div
                className="agency-mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
              />
              <motion.aside
                className="agency-mobile-drawer"
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
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>QuoteMeTrip</span>
                    </div>
                    <button
                      type="button"
                      className="agency-header-btn"
                      onClick={() => setMobileDrawerOpen(false)}
                      aria-label="Close menu"
                    >
                      <FiX />
                    </button>
                  </div>
                  <nav className="agency-nav-group">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isNavActive(item);
                      return (
                        <Link
                          key={item.key}
                          to={item.path}
                          className={`agency-nav-item ${active ? 'active' : ''}`}
                          onClick={() => setMobileDrawerOpen(false)}
                        >
                          <div className="agency-nav-item-content">
                            <Icon className="agency-nav-item-icon" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && <span className="agency-nav-badge">{item.badge}</span>}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="agency-sidebar-footer">
                  <div className="agency-company-chip">
                    <div className="agency-company-chip-title">{agencyName}</div>
                    <div className="agency-company-chip-status">
                      <FiCheckCircle /> Verified Partner Agency
                    </div>
                  </div>
                  <button
                    type="button"
                    className="agency-dropdown-item danger"
                    style={{
                      color: '#FCA5A5',
                      background: 'rgba(239, 68, 68, 0.1)',
                      marginTop: '0.5rem',
                    }}
                    onClick={logout}
                  >
                    <FiLogOut /> {t('header.signOut', 'Sign Out')}
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className={`agency-main-content ${isMessaging ? 'is-messaging-page' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={isMessaging ? { display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 } : undefined}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
