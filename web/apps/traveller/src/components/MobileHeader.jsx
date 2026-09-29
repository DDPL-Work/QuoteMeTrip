import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '@troublefree/ui';
import { NotificationButton } from './NotificationButton.jsx';
import { UserMenu } from './UserMenu.jsx';

export function MobileHeader({ notificationCount = 0, onNotificationClick }) {
  return (
    <header className="tf-portal-mobile-header">
      <Link to="/app" className="tf-portal-logo">
        Troublefree <span>Holiday</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NotificationButton count={notificationCount} onClick={onNotificationClick} />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
