/**
 * QuoteMyTrip Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications when the application tab is not focused or closed.
 * Safe for client-side execution — contains only public web client parameters, NO server secrets.
 */

// Import Firebase scripts for Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyA1fRDDVQE0bxlwrkcoLL6sxd0xeX2XP2c',
  authDomain: 'quotemetrip.firebaseapp.com',
  projectId: 'quotemetrip',
  storageBucket: 'quotemetrip.firebasestorage.app',
  messagingSenderId: '996229920703',
  appId: '1:996229920703:web:dd538e819af8fad844d30a',
  measurementId: 'G-BRPZZSLKNG',
};

// Initialize Firebase in Service Worker
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'QuoteMyTrip Alert';
  const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
  const deepLink =
    payload.data?.deepLink ||
    payload.data?.click_action ||
    payload.fcmOptions?.link ||
    '/';

  const notificationOptions = {
    body,
    icon: '/images/tfh_logo.png',
    badge: '/images/tfh_logo.png',
    tag: payload.data?.notificationId ? `qmt-${payload.data.notificationId}` : 'qmt-alert',
    data: {
      deepLink,
      notificationId: payload.data?.notificationId || null,
      ...payload.data,
    },
    requireInteraction: false,
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Deep link navigation on notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const deepLink = event.notification.data?.deepLink || '/';
  const targetUrl = new URL(deepLink, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
