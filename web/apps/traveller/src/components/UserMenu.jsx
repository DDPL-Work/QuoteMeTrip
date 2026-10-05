import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../features/auth/auth-context.js';
import { getMediaUrl } from '../lib/api.js';

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
  const rawAvatar = user?.profile?.profilePicture || user?.profile?.avatarUrl || user?.profilePicture || user?.avatarUrl || null;
  const avatarUrl = getMediaUrl(rawAvatar);
  const initials = (displayName[0] || 'T').toUpperCase();

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
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span
          className="tf-portal-user-avatar"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#147D33',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12px',
          }}
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
        </span>
        <span className="tf-portal-user-label">{displayName}</span>
        <FiChevronDown size={14} style={{ color: '#56625B' }} />
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
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiUser size={16} /> My Profile
          </Link>
          <button
            type="button"
            className="tf-portal-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              if (logout) logout();
            }}
            style={{ color: '#D93025', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
