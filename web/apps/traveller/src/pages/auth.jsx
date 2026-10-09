// Traveller auth pages (Phase 3) — thin wrappers around the shared
// UI shell and the auth forms. No business dashboard yet.

import { Link } from 'react-router-dom';
import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

function TravellerBrandHeader() {
  return (
    <div className="auth-brand-header">
      <img
        src="/images/tfh_logo_dark.png"
        alt="QuoteMeTrip"
        className="auth-brand-logo"
        onError={(e) => {
          e.target.style.display = 'none';
          const fallback = e.target.parentElement?.querySelector('.auth-brand-name');
          if (fallback) fallback.style.display = 'inline-block';
        }}
      />
      <span className="auth-brand-name" style={{ display: 'none' }}>
        QuoteMeTrip
      </span>
      <span className="auth-brand-badge">TRAVELLER</span>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthLayout
      brand={<TravellerBrandHeader />}
      title="Welcome back"
      subtitle="Sign in to your Traveller account."
    >
      <div style={{ marginBottom: '16px', textAlign: 'left' }}>
        <Link
          to="/"
          style={{
            color: '#147D33',
            fontWeight: '600',
            fontSize: '13.5px',
            textDecoration: 'none',
          }}
        >
          ← Back to Public Portal
        </Link>
      </div>
      <LoginForm />
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout
      brand={<TravellerBrandHeader />}
      title="Create your account"
      subtitle="Plan trouble-free holidays."
    >
      <div style={{ marginBottom: '16px', textAlign: 'left' }}>
        <Link
          to="/"
          style={{
            color: '#147D33',
            fontWeight: '600',
            fontSize: '13.5px',
            textDecoration: 'none',
          }}
        >
          ← Back to Public Portal
        </Link>
      </div>
      <RegisterForm />
    </AuthLayout>
  );
}
