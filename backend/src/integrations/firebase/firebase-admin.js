/**
 * Firebase Admin SDK Integration (QuoteMyTrip).
 *
 * Server-side Firebase Messaging initialization and delivery.
 * Server credentials remain strictly server-side and are NEVER exposed to the frontend.
 * Provides graceful simulation mode when Firebase credentials are not configured
 * so integration tests and local development proceed reliably without errors.
 */
import admin from 'firebase-admin';

let messagingInstance = null;
let isInitialized = false;
let isMockMode = false;

export function getFirebaseAdmin() {
  if (isInitialized) {
    return { messaging: messagingInstance, isMockMode, admin };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'quotemetrip';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

  if (clientEmail && privateKey) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
      }
      messagingInstance = admin.messaging();
      isInitialized = true;
      isMockMode = false;
      console.log(`[FirebaseAdmin] Initialized for QuoteMyTrip (Project: ${projectId})`);
      return { messaging: messagingInstance, isMockMode: false, admin };
    } catch (err) {
      console.warn('[FirebaseAdmin] Failed to initialize with provided credentials:', err.message);
    }
  }

  // Graceful simulated mode for test and dev environments without cloud secrets
  isInitialized = true;
  isMockMode = true;
  messagingInstance = {
    sendEachForMulticast: async ({ tokens, notification, data, webpush }) => {
      // Return simulated success responses
      return {
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map((token) => ({
          success: true,
          messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        })),
      };
    },
    send: async (message) => {
      return `mock-msg-${Date.now()}`;
    },
  };

  return { messaging: messagingInstance, isMockMode: true, admin };
}

/**
 * Send push notification to multiple tokens / FIDs.
 * Identifies and returns invalid/unregistered tokens for automatic database cleanup.
 */
export async function sendMulticastPushNotification({
  tokens,
  title,
  body,
  data = {},
  deepLink = '/',
}) {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const { messaging, isMockMode: mock } = getFirebaseAdmin();

  // Stringify all data payload values for FCM compliance
  const sanitizedData = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) {
      sanitizedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
    }
  }
  if (deepLink) {
    sanitizedData.deepLink = String(deepLink);
    sanitizedData.click_action = String(deepLink);
  }

  const messagePayload = {
    tokens,
    notification: {
      title,
      body,
    },
    data: sanitizedData,
    webpush: {
      notification: {
        title,
        body,
        icon: '/images/tfh_logo.png',
        badge: '/images/tfh_logo.png',
        tag: sanitizedData.notificationId ? `qmt-notif-${sanitizedData.notificationId}` : undefined,
        data: {
          deepLink: deepLink || '/',
          notificationId: sanitizedData.notificationId || null,
        },
      },
      fcmOptions: {
        link: deepLink || '/',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(messagePayload);
    const invalidTokens = [];

    if (response.responses && Array.isArray(response.responses)) {
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/mismatched-credential'
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });
    }

    if (mock) {
      console.log(`[FCM Mock] Simulated delivery to ${tokens.length} token(s): "${title}"`);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (err) {
    console.error('[FirebaseAdmin] FCM dispatch error:', err.message);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
      error: err.message,
    };
  }
}
