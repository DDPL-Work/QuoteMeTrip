import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context.js';

export function UserMenu() {
  let user = null;
  let logout = null;

  try {
    const auth = useAuth();
    user = auth.user;
    logout = auth.logout;
  } catch {
    // If rendered outside AuthProvider in isolated tests
  }

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || 'Traveller';
  const email = user?.email || '';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="tf-portal-user-menu" ref={menuRef}>
      <button
        type="button"
        className="tf-portal-user-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <span className="tf-portal-user-avatar">👤</span>
        <span className="tf-portal-user-label">{displayName}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen ? (
        <div className="tf-portal-user-dropdown" role="menu">
          <div className="tf-portal-user-info">
            <div className="tf-portal-user-name">{displayName}</div>
            {email ? <div className="tf-portal-user-email">{email}</div> : null}
          </div>
          <Link
            to="/profile"
            className="tf-portal-dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            ⚙️ My Profile
          </Link>
          <button
            type="button"
            className="tf-portal-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              if (logout) logout();
            }}
            style={{ color: 'var(--tf-portal-warn)' }}
          >
            🚪 Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
