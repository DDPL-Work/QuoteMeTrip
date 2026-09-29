// Authentication state for the app (Phase 3).
//
// Holds ONLY the in-memory session: `user` (+ the access token kept
// inside the shared api-client). Lifecycle:
//
//   mount -> refresh via HttpOnly cookie -> /me -> authenticated
//         -> failure -> unauthenticated (no redirect flicker: routes
//            wait for `isLoading` before deciding)
//
// Backend authorization remains mandatory — the role checks in the
// router are UX only.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, authApi, setUnauthorizedListener } from '../../lib/api.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ role, loginPath = '/login', children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    apiClient.clearAccessToken();
    setUser(null);
  }, []);

  // Initial session recovery: refresh -> me. No persisted tokens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await authApi.refresh();
        apiClient.setAccessToken(refreshed.accessToken);
        const identity = await authApi.me();
        if (!cancelled) setUser(identity.user);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // Session lost mid-app (refresh failed elsewhere): clear and go to
  // THIS app's login page — never another app's URL.
  useEffect(() => {
    setUnauthorizedListener(() => {
      clearSession();
      navigate(loginPath, { replace: true });
    });
    return () => setUnauthorizedListener(null);
  }, [clearSession, navigate, loginPath]);

  const login = useCallback(async (input) => {
    const result = await authApi.login(input);
    apiClient.setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (registerCall) => {
    const result = await registerCall();
    apiClient.setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const result = await authApi.googleLogin(idToken);
    apiClient.setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate(loginPath, { replace: true });
    }
  }, [clearSession, navigate, loginPath]);

  const value = useMemo(
    () => ({
      user,
      // The required role for THIS app (traveller/agency/admin).
      // Guards compare user.role against it; the backend enforces it.
      role,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      googleLogin,
      logout,
    }),
    [user, role, isLoading, login, register, googleLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
