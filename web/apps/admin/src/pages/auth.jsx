// Admin auth pages (Phase 3).
//
// Login only. Admin registration does not exist in this portal —
// accounts are provisioned through the controlled CLI process.

import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

export function LoginPage() {
  return (
    <AuthLayout title="Admin sign in" subtitle="Restricted area. Authorized personnel only.">
      <LoginForm />
    </AuthLayout>
  );
}

// Minimal authenticated landing — admin analytics arrive later.
export function HomePage() {
  const { user, logout } = useAuth();
  return (
    <main className="portal-shell">
      <h1>Admin Portal</h1>
      <p>
        Signed in as {user?.email} ({user?.role}).
      </p>
      <button type="button" className="auth-submit auth-signout" onClick={logout}>
        Sign out
      </button>
    </main>
  );
}
