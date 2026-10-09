// Admin auth pages (Phase 3).
//
// Login only. Admin registration does not exist in this portal —
// accounts are provisioned through the controlled CLI process.

import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

function AdminBrandHeader() {
  return (
    <div className="auth-brand-header">
      <img
        src="/images/tfh_logo_dark.png"
        alt="QuoteMeTrip Logo"
        className="auth-brand-logo"
        onError={(e) => {
          e.target.style.display = 'none';
          const fallback = e.target.parentElement?.querySelector('.auth-brand-name');
          if (fallback) fallback.style.display = 'inline-block';
        }}
      />
      <div className="auth-brand-info">
        <span className="auth-brand-name" style={{ display: 'none' }}>
          QuoteMeTrip
        </span>
        <span className="auth-brand-badge">ADMIN PORTAL</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthLayout
      brand={<AdminBrandHeader />}
      title="Admin Operations Sign In"
      subtitle="Restricted workspace. Authorized personnel only."
    >
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
