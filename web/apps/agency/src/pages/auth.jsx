// Agency auth pages (Phase 3).

import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

export function LoginPage() {
  return (
    <AuthLayout title="Agency sign in" subtitle="Manage your travel business.">
      <LoginForm />
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout title="Register your agency" subtitle="Join the Troublefree Holiday network.">
      <RegisterForm />
    </AuthLayout>
  );
}

// Minimal authenticated landing — agency dashboards arrive later.
export function HomePage() {
  const { user, logout } = useAuth();
  return (
    <main className="portal-shell">
      <h1>Agency Portal</h1>
      <p>
        Signed in as {user?.email} ({user?.role}).
      </p>
      <button type="button" className="auth-submit auth-signout" onClick={logout}>
        Sign out
      </button>
    </main>
  );
}
