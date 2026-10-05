import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

function AgencyBrandHeader() {
  return (
    <div className="auth-brand-header">
      <img
        src="/images/tfh_logo.png"
        alt="QuoteMeTrip"
        className="auth-brand-logo"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <span className="auth-brand-name">QuoteMeTrip</span>
      <span className="auth-brand-badge">AGENCY PORTAL</span>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthLayout title="Agency sign in" subtitle="Manage your travel business and client requests.">
      <AgencyBrandHeader />
      <LoginForm />
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout
      title="Register your agency"
      subtitle="Join the QuoteMeTrip verified agency partner network."
    >
      <AgencyBrandHeader />
      <RegisterForm />
    </AuthLayout>
  );
}

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
