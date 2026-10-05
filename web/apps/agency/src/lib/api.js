// Shared backend access for the web app (Phase 3).
//
// The access token lives ONLY in the api-client's in-memory store —
// never in localStorage, sessionStorage, or any persisted location.
// The refresh token travels in the HttpOnly cookie (withCredentials)
// and is never exposed to application code.
//
// Session loss (refresh failed) is reported through a mutable listener
// so the React auth provider — which owns navigation — can clear its
// state and redirect to this app's own login page.

import {
  createApiClient,
  createAuthApi,
  createAgencyRequestApi,
  createAgencyQuotationApi,
  createAgencyRatingApi,
  createAgencyProfileApi,
  createMessagingApi,
  createJobApi,
  createNotificationApi,
} from '@troublefree/api-client';

const rawUrl =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  'http://localhost:5001';
const apiBaseUrl = rawUrl.replace(/\/api\/v1\/?$/, '');

let unauthorizedListener = null;

export const apiClient = createApiClient({
  baseURL: apiBaseUrl,
  onUnauthorized: () => unauthorizedListener?.(),
});

export function setUnauthorizedListener(listener) {
  unauthorizedListener = listener;
}

export const authApi = createAuthApi(apiClient);
export const agencyProfileApi = createAgencyProfileApi(apiClient);
export const agencyRequestApi = createAgencyRequestApi(apiClient);
export const agencyQuotationApi = createAgencyQuotationApi(apiClient);
export const agencyRatingApi = createAgencyRatingApi(apiClient);
export const messagingApi = createMessagingApi(apiClient);
export const jobApi = createJobApi(apiClient);
export const notificationApi = createNotificationApi(apiClient);

export { apiBaseUrl };

export function getMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const resolveMediaUrl = getMediaUrl;
