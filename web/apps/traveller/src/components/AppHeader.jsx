import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '@troublefree/ui';
import { NotificationButton } from './NotificationButton.jsx';
import { UserMenu } from './UserMenu.jsx';

export function AppHeader({ notificationCount = 0, onNotificationClick }) {
  return (
    <header className="tf-portal-top-header">
      <Link to="/app" className="tf-portal-logo" aria-label="Troublefree Holiday Home">
        <img src="/images/tfh_logo.png" alt="Troublefree Holiday" height="38" style={{ display: 'block' }} />
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
          🌐 Public Portal
        </Link>
        <NotificationButton count={notificationCount} onClick={onNotificationClick} />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
