import { Link } from 'react-router-dom';
import { FiGlobe } from 'react-icons/fi';
import { LanguageSwitcher } from '@troublefree/ui';
import { NotificationButton } from './NotificationButton.jsx';
import { UserMenu } from './UserMenu.jsx';

export function AppHeader({ notificationCount = 0, onNotificationClick }) {
  return (
    <header className="tf-portal-top-header">
      <Link
        to="/app"
        className="tf-portal-logo"
        aria-label="QuoteMeTrip Home"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
      >
        <img
          src="/images/tfh_logo.png"
          alt="QuoteMeTrip"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Troublefree Holiday
        </span>
      </Link>

      <div className="tf-portal-header-actions">
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#E5F2EA',
            color: '#0C4E28',
            fontSize: '13px',
            fontWeight: '700',
            textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          <FiGlobe size={14} /> Public Portal
        </Link>
        <NotificationButton count={notificationCount} onClick={onNotificationClick} />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
