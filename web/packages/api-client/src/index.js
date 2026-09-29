// @troublefree/api-client
//
// Shared HTTP boundary for the Traveller, Agency, and Admin apps.
//
// Phase 3: centralized authentication behavior —
//   - baseURL + credentials (HttpOnly refresh cookie)
//   - in-memory access token (NEVER localStorage/sessionStorage)
//   - Authorization header injection
//   - 401 handling: single-flight refresh, retry the original request
//     exactly once, then clear state and notify the app
//
// Application-specific login URLs stay in each app: the client reports
// session loss through `onUnauthorized` and the app decides where to
// redirect.

import axios from 'axios';

const REFRESH_PATH = '/api/v1/auth/refresh';
const UNAUTHORIZED = 401;

/**
 * Create a backend API client with centralized token handling.
 *
 * @param {object} options
 * @param {string} options.baseURL - backend origin (e.g. http://localhost:5000)
 * @param {() => void} [options.onUnauthorized] - called when the session
 *   cannot be recovered (refresh failed). The app clears its auth state
 *   and redirects to its own login page.
 * @param {import('axios').AxiosInstance} [options.transport] - injectable
 *   axios instance (tests / SSR). Defaults to a fresh instance.
 */
export function createApiClient({ baseURL, onUnauthorized, transport } = {}) {
  if (!baseURL) {
    throw new Error('createApiClient() requires a baseURL.');
  }

  const instance = transport || axios.create({ baseURL, withCredentials: true });
  if (!transport) {
    instance.defaults.baseURL = baseURL;
    instance.defaults.withCredentials = true;
  }

  // In-memory access token. Refresh travels in the HttpOnly cookie and
  // is never exposed to application code or persistent storage.
  let accessToken = null;
  // Single-flight refresh: concurrent 401s share one refresh request.
  let refreshPromise = null;

  function setAccessToken(token) {
    accessToken = token || null;
  }

  function getAccessToken() {
    return accessToken;
  }

  function clearAccessToken() {
    accessToken = null;
  }

  async function performRefresh() {
    // Bypass interceptors: the refresh request itself must never
    // trigger another refresh attempt (no infinite recursion).
    const response = await instance.post(REFRESH_PATH, {}, { _skipAuthRetry: true });
    const next = response?.data?.data?.accessToken;
    if (!next) {
      throw new Error('Refresh response did not contain an access token.');
    }
    setAccessToken(next);
    return next;
  }

  function refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  function handleSessionLost() {
    clearAccessToken();
    try {
      onUnauthorized?.();
    } catch {
      // Listener failures must never break request handling.
    }
  }

  instance.interceptors.request.use((config) => {
    if (accessToken && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error || {};
      const isUnauthorized = response?.status === UNAUTHORIZED;
      const canRetry =
        isUnauthorized &&
        config &&
        !config._authRetried &&
        !config._skipAuthRetry &&
        config.url !== REFRESH_PATH;

      if (!canRetry) {
        if (isUnauthorized && config?.url === REFRESH_PATH) {
          handleSessionLost();
        }
        return Promise.reject(error);
      }

      config._authRetried = true;
      try {
        const next = await refreshAccessToken();
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${next}`;
        return instance.request(config);
      } catch (refreshError) {
        // A 401 from the refresh request itself is already reported by
        // its own interceptor branch above — only report here for
        // network-level (response-less) refresh failures.
        if (refreshError?.response?.status !== UNAUTHORIZED) {
          handleSessionLost();
        }
        // Surface the ORIGINAL failure (e.g. invalid credentials), not
        // the follow-on refresh failure, so callers keep the meaningful
        // code and message.
        return Promise.reject(error);
      }
    },
  );

  return {
    http: instance,
    setAccessToken,
    getAccessToken,
    clearAccessToken,
    refreshAccessToken,
  };
}

/**
 * Normalize axios failures into Errors carrying `status` and `code`
 * (matching the backend `{ success: false, error: { code, message } }`
 * envelope) so UI layers can render friendly messages.
 */
export function toApiError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  const message = data?.error?.message || error?.message || fallbackMessage;
  const normalized = new Error(message);
  normalized.status = error?.response?.status || 0;
  normalized.code = data?.error?.code || 'UNKNOWN_ERROR';
  normalized.cause = error;
  return normalized;
}

/**
 * Shared auth resource calls. Every app uses these — no per-app token
 * handling, no duplicated endpoint strings.
 */
export function createAuthApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    registerTraveller: (input) => unwrap(http.post('/api/v1/auth/register/traveller', input)),
    registerAgency: (input) => unwrap(http.post('/api/v1/auth/register/agency', input)),
    login: (input) => unwrap(http.post('/api/v1/auth/login', input)),
    googleLogin: (idToken) => unwrap(http.post('/api/v1/auth/google', { idToken })),
    refresh: () => unwrap(http.post(REFRESH_PATH, {})),
    logout: () => unwrap(http.post('/api/v1/auth/logout', {})),
    logoutAll: () => unwrap(http.post('/api/v1/auth/logout-all', {})),
    me: () => unwrap(http.get('/api/v1/auth/me')),
  };
}

/**
 * Traveller profile resource calls (Phase 4).
 */
export function createTravellerApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    me: () => unwrap(http.get('/api/v1/travellers/me')),
    updateMe: (input) => unwrap(http.patch('/api/v1/travellers/me', input)),
  };
}

/**
 * Route planning resource calls (Phase 4).
 */
export function createRouteApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    calculate: (input) => unwrap(http.post('/api/v1/routes/calculate', input)),
    create: (input) => unwrap(http.post('/api/v1/routes', input)),
    getById: (id) => unwrap(http.get(`/api/v1/routes/${id}`)),
    update: (id, input) => unwrap(http.patch(`/api/v1/routes/${id}`, input)),
    remove: (id) => unwrap(http.delete(`/api/v1/routes/${id}`)),
  };
}

/**
 * Travel-request resource calls (Phase 4).
 */
export function createTravelRequestApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    create: (input) => unwrap(http.post('/api/v1/travel-requests', input)),
    list: () => unwrap(http.get('/api/v1/travel-requests')),
    getById: (id) => unwrap(http.get(`/api/v1/travel-requests/${id}`)),
    update: (id, input) => unwrap(http.patch(`/api/v1/travel-requests/${id}`, input)),
    submit: (id) => unwrap(http.post(`/api/v1/travel-requests/${id}/submit`, {})),
    cancel: (id) => unwrap(http.post(`/api/v1/travel-requests/${id}/cancel`, {})),
    addDay: (id, input) => unwrap(http.post(`/api/v1/travel-requests/${id}/days`, input)),
    updateDay: (id, dayId, input) =>
      unwrap(http.patch(`/api/v1/travel-requests/${id}/days/${dayId}`, input)),
    deleteDay: (id, dayId) => unwrap(http.delete(`/api/v1/travel-requests/${id}/days/${dayId}`)),
    listQuotations: (id) => unwrap(http.get(`/api/v1/travel-requests/${id}/quotations`)),
  };
}

/**
 * Quotation detail resource calls for travellers (Phase 5).
 */
export function createTravellerQuotationApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    getById: (id) => unwrap(http.get(`/api/v1/quotations/${id}`)),
    accept: (id) => unwrap(http.post(`/api/v1/quotations/${id}/accept`, {})),
  };
}

/**
 * Agency inbox resource calls (Phase 5): matched requests only.
 */
export function createAgencyRequestApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    list: (params = {}) => unwrap(http.get('/api/v1/agency/travel-requests', { params })),
    getById: (id) => unwrap(http.get(`/api/v1/agency/travel-requests/${id}`)),
    markViewed: (id) => unwrap(http.post(`/api/v1/agency/travel-requests/${id}/view`, {})),
  };
}

/**
 * Agency quotation resource calls (Phase 5): own quotations only.
 */
export function createAgencyQuotationApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    createForRequest: (requestId, input) =>
      unwrap(http.post(`/api/v1/agency/travel-requests/${requestId}/quotations`, input)),
    list: () => unwrap(http.get('/api/v1/agency/quotations')),
    getById: (id) => unwrap(http.get(`/api/v1/agency/quotations/${id}`)),
    update: (id, input) => unwrap(http.patch(`/api/v1/agency/quotations/${id}`, input)),
    submit: (id) => unwrap(http.post(`/api/v1/agency/quotations/${id}/submit`, {})),
    withdraw: (id) => unwrap(http.post(`/api/v1/agency/quotations/${id}/withdraw`, {})),
  };
}

/**
 * Messaging resource calls (Phase 6): own conversations only.
 */
export function createMessagingApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    listConversations: (params = {}) => unwrap(http.get('/api/v1/conversations', { params })),
    createConversation: (input) => unwrap(http.post('/api/v1/conversations', input)),
    getConversation: (id) => unwrap(http.get(`/api/v1/conversations/${id}`)),
    listMessages: (id, params = {}) =>
      unwrap(http.get(`/api/v1/conversations/${id}/messages`, { params })),
    sendMessage: (id, input) => unwrap(http.post(`/api/v1/conversations/${id}/messages`, input)),
    markRead: (id) => unwrap(http.patch(`/api/v1/conversations/${id}/read`, {})),
  };
}

/**
 * Job resource calls (Phase 6): own jobs (traveller/agency), read-all admin.
 */
export function createJobApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    list: () => unwrap(http.get('/api/v1/jobs')),
    getById: (id) => unwrap(http.get(`/api/v1/jobs/${id}`)),
    updateStatus: (id, status) => unwrap(http.patch(`/api/v1/jobs/${id}/status`, { status })),
  };
}

/**
 * Notifications resource calls (Phase 3+).
 */
export function createNotificationApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    list: (params = {}) => unwrap(http.get('/api/v1/notifications', { params })),
    getUnreadCount: () => unwrap(http.get('/api/v1/notifications/unread-count')),
    markRead: (id) => unwrap(http.patch(`/api/v1/notifications/${id}/read`, {})),
    markAllRead: () => unwrap(http.post('/api/v1/notifications/mark-all-read', {})),
  };
}

/**
 * Admin operations resource calls (Phase 7).
 */
export function createAdminApi(client) {
  const { http } = client;

  async function unwrap(promise) {
    try {
      const response = await promise;
      return response.data?.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  return {
    // Dashboard & Metrics
    getDashboardMetrics: () => unwrap(http.get('/api/v1/admin/dashboard')),

    // Agencies
    listAgencies: (params = {}) => unwrap(http.get('/api/v1/admin/agencies', { params })),
    getAgencyById: (id) => unwrap(http.get(`/api/v1/admin/agencies/${id}`)),
    approveAgency: (id) => unwrap(http.post(`/api/v1/admin/agencies/${id}/approve`, {})),
    rejectAgency: (id, reason) =>
      unwrap(http.post(`/api/v1/admin/agencies/${id}/reject`, { reason })),
    suspendAgency: (id, reason) =>
      unwrap(http.post(`/api/v1/admin/agencies/${id}/suspend`, { reason })),
    reactivateAgency: (id) => unwrap(http.post(`/api/v1/admin/agencies/${id}/reactivate`, {})),
    verifyDocument: (agencyId, documentId) =>
      unwrap(http.post(`/api/v1/admin/agencies/${agencyId}/documents/${documentId}/verify`, {})),
    rejectDocument: (agencyId, documentId, note) =>
      unwrap(
        http.post(`/api/v1/admin/agencies/${agencyId}/documents/${documentId}/reject`, { note }),
      ),

    // Membership Plans
    listMembershipPlans: () => unwrap(http.get('/api/v1/admin/membership-plans')),
    createMembershipPlan: (input) => unwrap(http.post('/api/v1/admin/membership-plans', input)),
    updateMembershipPlan: (id, input) =>
      unwrap(http.patch(`/api/v1/admin/membership-plans/${id}`, input)),

    // Agency Memberships
    listMemberships: (params = {}) => unwrap(http.get('/api/v1/admin/memberships', { params })),
    getMembershipById: (id) => unwrap(http.get(`/api/v1/admin/memberships/${id}`)),
    createAgencyMembership: (agencyId, input) =>
      unwrap(http.post(`/api/v1/admin/agencies/${agencyId}/membership`, input)),
    confirmPayment: (id, input) =>
      unwrap(http.post(`/api/v1/admin/memberships/${id}/confirm-payment`, input)),
    suspendMembership: (id) => unwrap(http.post(`/api/v1/admin/memberships/${id}/suspend`, {})),
    reactivateMembership: (id) =>
      unwrap(http.post(`/api/v1/admin/memberships/${id}/reactivate`, {})),
    updateMembership: (id, input) => unwrap(http.patch(`/api/v1/admin/memberships/${id}`, input)),

    // Commissions
    listCommissions: (params = {}) => unwrap(http.get('/api/v1/admin/commissions', { params })),
    getCommissionSummary: () => unwrap(http.get('/api/v1/admin/commissions/summary')),
    getCommissionById: (id) => unwrap(http.get(`/api/v1/admin/commissions/${id}`)),
    updateCommissionStatus: (id, input) =>
      unwrap(http.patch(`/api/v1/admin/commissions/${id}/status`, input)),

    // Operational Visibility
    listTravelRequests: (params = {}) =>
      unwrap(http.get('/api/v1/admin/travel-requests', { params })),
    getTravelRequestById: (id) => unwrap(http.get(`/api/v1/admin/travel-requests/${id}`)),
    listJobs: (params = {}) => unwrap(http.get('/api/v1/admin/jobs', { params })),
    getJobById: (id) => unwrap(http.get(`/api/v1/admin/jobs/${id}`)),

    // Audit Logs
    listAuditLogs: (params = {}) => unwrap(http.get('/api/v1/admin/audit-logs', { params })),
  };
}
