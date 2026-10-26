// Admin auth pages (Phase 3).
//
// Login only. Admin registration does not exist in this portal —
// accounts are provisioned through the controlled CLI process.

import { AuthLayout } from '@troublefree/ui';
import { useI18n } from '@troublefree/i18n';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

function AdminBrandHeader() {
  const { t } = useI18n();
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
        <span className="auth-brand-badge">{t('admin.auth.brandBadge')}</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useI18n();
  return (
    <AuthLayout
      brand={<AdminBrandHeader />}
      title={t('admin.auth.loginTitle')}
      subtitle={t('admin.auth.loginSubtitle')}
    >
      <LoginForm />
    </AuthLayout>
  );
}

// Minimal authenticated landing — admin analytics arrive later.
export function HomePage() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  return (
    <main className="portal-shell">
      <h1>{t('admin.dashboard')}</h1>
      <p>
        {t('admin.common.signedInAs', { email: user?.email })} ({user?.role}).
      </p>
      <button type="button" className="auth-submit auth-signout" onClick={logout}>
        {t('admin.common.signOut')}
      </button>
    </main>
  );
}
