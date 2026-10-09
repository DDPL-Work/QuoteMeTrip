import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader.jsx';
import { AppSidebar } from '../components/AppSidebar.jsx';
import { MobileHeader } from '../components/MobileHeader.jsx';
import { MobileBottomNav } from '../components/MobileBottomNav.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';
import { ToastProvider, useToast } from '../components/feedback/ToastProvider.jsx';
import { useEffect, useState } from 'react';
import * as apiModule from '../lib/api.js';
const notificationApi = apiModule?.notificationApi;
import {
  requestNotificationPermissionAndRegister,
  initForegroundNotificationListener,
} from '../lib/firebase.js';

import { connectMessagingSocket } from '../lib/socket.js';

function TravellerNotificationManager({ unreadCount, setUnreadCount, setUnreadMessages }) {
  const { showToast } = useToast();

  useEffect(() => {
    // Request permission politely and register device push token with backend
    if (notificationApi) {
      try {
        requestNotificationPermissionAndRegister(notificationApi).catch(() => {});
      } catch {
        // Safe fallback in test or unsupported environment
      }
    }

    const seenIds = new Set();
    const handleIncoming = (item) => {
      const id = item?.id || item?.data?.id || `${item?.title || item?.notification?.title}_${Date.now()}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);
      setTimeout(() => seenIds.delete(id), 10000);

      setUnreadCount((prev) => prev + 1);
      if (
        item?.eventType === 'MESSAGE_RECEIVED' ||
        item?.entityType === 'MESSAGE' ||
        item?.data?.conversationId
      ) {
        setUnreadMessages?.((prev) => prev + 1);
      }
      const title = item?.notification?.title || item?.title || item?.data?.title || 'Notification';
      const body = item?.notification?.body || item?.body || item?.data?.body || '';
      if (showToast) {
        showToast(`${title}: ${body}`, 'info');
      }
      window.dispatchEvent(new CustomEvent('qmt:notification:new', { detail: item }));
    };

    // Foreground FCM listener
    const cleanupPromise = initForegroundNotificationListener((payload) => {
      handleIncoming(payload);
    });

    // Realtime Socket.IO listener (Active across entire app without needing page reload)
    let socket = null;
    try {
      socket = connectMessagingSocket();
      if (socket) {
        socket.on('notification:new', handleIncoming);
      }
    } catch {
      // Safe fallback in test or serverless environments
    }

    return () => {
      if (socket) {
        socket.off('notification:new', handleIncoming);
      }
      cleanupPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      }).catch(() => {});
    };
  }, [setUnreadCount, showToast]);

  return null;
}

export function TravellerAppLayout({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const isMessaging = location.pathname.includes('/messages');
  const messagingApi = apiModule?.messagingApi;

  useEffect(() => {
    let active = true;
    notificationApi
      ?.getUnreadCount()
      .then((res) => {
        if (active) setUnreadCount(res?.count ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (typeof messagingApi?.listConversations === 'function') {
      try {
        const p = messagingApi.listConversations({ page: 1, pageSize: 50 });
        if (p && typeof p.then === 'function') {
          p.then((res) => {
            if (!active) return;
            const total = (res?.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setUnreadMessages(total);
          }).catch(() => {});
        }
      } catch {
        // Safe fallback in mock or test environments
      }
    }
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <TravellerNotificationManager
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
          setUnreadMessages={setUnreadMessages}
        />
        <div className="tf-portal-root">
          <AppHeader
            notificationCount={unreadCount}
            onNotificationCountChange={setUnreadCount}
          />
          <MobileHeader notificationCount={unreadCount} />

          <div className="tf-portal-shell">
            <AppSidebar badges={{ messages: unreadMessages > 0 ? unreadMessages : null }} />
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
