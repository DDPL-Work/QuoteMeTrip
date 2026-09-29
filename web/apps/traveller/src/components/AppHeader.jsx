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
        <NotificationButton count={notificationCount} onClick={onNotificationClick} />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
