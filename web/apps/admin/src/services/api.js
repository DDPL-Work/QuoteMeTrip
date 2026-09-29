import { createApiClient, createAuthApi, createAdminApi } from '@troublefree/api-client';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = createApiClient({
  baseURL,
  onUnauthorized: () => {
    // Handled in AuthContext
  },
});

export const authApi = createAuthApi(apiClient);
export const adminApi = createAdminApi(apiClient);
