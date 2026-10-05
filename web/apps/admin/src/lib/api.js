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

import { createApiClient, createAuthApi, createAdminApi } from '@troublefree/api-client';

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
export const adminApi = createAdminApi(apiClient);

export { apiBaseUrl };
