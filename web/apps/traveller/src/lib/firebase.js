/**
 * QuoteMyTrip Firebase Messaging Client Configuration & Registration
 *
 * Implements:
 * - Public Firebase web configuration via environment variables
 * - Web Push VAPID key handling
 * - Service worker registration for /firebase-messaging-sw.js
 * - Browser permission requesting (polite, non-intrusive)
 * - Device / Push Token registration with QuoteMyTrip backend
 * - Foreground notification listener (updates store/badges without duplicate system popups)
 */
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Public frontend configuration (Safe for browser bundle — no server secrets)
const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

export const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || 'AIzaSyA1fRDDVQE0bxlwrkcoLL6sxd0xeX2XP2c',
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || 'quotemetrip.firebaseapp.com',
  projectId: env?.VITE_FIREBASE_PROJECT_ID || 'quotemetrip',
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || 'quotemetrip.firebasestorage.app',
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '996229920703',
  appId: env?.VITE_FIREBASE_APP_ID || '1:996229920703:web:dd538e819af8fad844d30a',
  measurementId: env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-BRPZZSLKNG',
};

export const VAPID_KEY =
  env?.VITE_FIREBASE_VAPID_KEY ||
  'BJ8R3XlUqIuO8qFzWpL9e2mY7nRtK5vAbCxDzE1sF2gH3jK4lM5nP6qR7sT8uV9wX0yZ';

let firebaseApp = null;
let messagingInstance = null;
let analyticsInstance = null;

export function getFirebaseApp() {
  if (!firebaseApp) {
    const existing = getApps();
    firebaseApp = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  const supported = await isAnalyticsSupported().catch(() => false);
  if (!supported) return null;
  if (!analyticsInstance) {
    const app = getFirebaseApp();
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
}

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (!messagingInstance) {
    const app = getFirebaseApp();
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

/**
 * Polite permission requester & FCM registration.
 * Registers service worker and sends token to QuoteMyTrip backend.
 */
export async function requestNotificationPermissionAndRegister(notificationApi) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { status: 'unsupported' };
  }

  // If already denied, do not repeatedly annoy user
  if (Notification.permission === 'denied') {
    return { status: 'denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { status: permission };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { status: 'unsupported_messaging' };
    }

    // Register messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    // Obtain FCM client registration token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token && notificationApi?.registerPushToken) {
      await notificationApi.registerPushToken({
        token,
        platform: 'web',
        browser: navigator.userAgent.slice(0, 100),
        permissionStatus: 'granted',
      });
      console.log('[FCM] Successfully registered device push token with backend');
    }

    return { status: 'granted', token };
  } catch (err) {
    console.warn('[FCM] Push token registration skipped or failed:', err.message);
    return { status: 'error', error: err.message };
  }
}

/**
 * Listen for foreground FCM messages while the tab is open.
 * Updates in-app state / UI without generating duplicate OS popups.
 */
export async function initForegroundNotificationListener(callback) {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log('[FCM Foreground] Message received:', payload);
      if (typeof callback === 'function') {
        callback(payload);
      }
      window.dispatchEvent(
        new CustomEvent('qmt:fcm_message', {
          detail: payload,
        }),
      );
    });
  } catch (err) {
    console.warn('[FCM Foreground] Failed to attach listener:', err.message);
    return () => {};
  }
}
