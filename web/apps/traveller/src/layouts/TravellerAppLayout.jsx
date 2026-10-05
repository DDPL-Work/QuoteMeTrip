import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader.jsx';
import { AppSidebar } from '../components/AppSidebar.jsx';
import { MobileHeader } from '../components/MobileHeader.jsx';
import { MobileBottomNav } from '../components/MobileBottomNav.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';
import { ToastProvider } from '../components/feedback/ToastProvider.jsx';
import { useEffect, useState } from 'react';
import { notificationApi } from '../lib/api.js';

export function TravellerAppLayout({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isMessaging = location.pathname.includes('/messages');

  useEffect(() => {
    let active = true;
    notificationApi
      .getUnreadCount()
      .then((res) => {
        if (active) setUnreadCount(res?.count ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="tf-portal-root">
          <AppHeader notificationCount={unreadCount} />
          <MobileHeader notificationCount={unreadCount} />

          <div className="tf-portal-shell">
            <AppSidebar />
            <main
              className={`tf-portal-main ${isMessaging ? 'is-messaging-page' : ''}`}
              id="main-content"
            >
              {children || <Outlet />}
            </main>
          </div>

          <MobileBottomNav />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
