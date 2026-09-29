// Route guards (Phase 3).
//
// 401 (unauthenticated) -> redirect to /login.
// 403 (authenticated, wrong role) -> inline "Access denied" with role
// context and logout — never a login loop.
//
// These guards are UX only: every protected backend endpoint re-checks
// authentication and role with `authenticate` + `authorize`.

import { Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@troublefree/ui';
import { useAuth } from './auth-context.js';

export function SessionPending() {
  return (
    <main className="portal-shell">
      <p>Checking your session…</p>
    </main>
  );
}

export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionPending />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <SessionPending />;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return (
      <AuthLayout title="Access denied" subtitle="This area belongs to a different portal.">
        <p className="auth-error" role="alert">
          You are signed in as {user.email} ({user.role}). This page requires: {roles.join(', ')}.
        </p>
        <button type="button" className="auth-submit" onClick={logout}>
          Sign out
        </button>
      </AuthLayout>
    );
  }
  return children;
}

export function PublicOnly({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SessionPending />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
