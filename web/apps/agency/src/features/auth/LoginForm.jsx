// Agency login form (Phase 3).
//
// Corporate/agency email + password. Social login is intentionally NOT
// offered here — the backend rejects agency Google login regardless of
// what any UI shows.

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField, PasswordInput, LoadingButton, AuthError, ForgotPasswordModal, toast } from '@troublefree/ui';
import { useI18n } from '@troublefree/i18n';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';
import { authApi } from '../../lib/api.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    const next = {};
    if (!EMAIL_PATTERN.test(email)) next.email = 'Enter a valid agency email address.';
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(Object.values(next)[0]);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await login({ email, password });
      toast.success('Logged in successfully');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      const msg = friendlyAuthMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="email" label="Agency email" error={fieldErrors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={submitting}
          />
        </FormField>
        <FormField id="password" label="Password" error={fieldErrors.password}>
          <PasswordInput id="password" name="password" disabled={submitting} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {t('auth.forgotPassword', 'Forgot password?')}
          </button>
        </div>

        <AuthError error={error} />
        <LoadingButton loading={submitting}>Sign in</LoadingButton>
        <p className="auth-switch">
          New agency? <Link to="/register">Register your agency</Link>
        </p>
      </form>

      <ForgotPasswordModal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        authApi={authApi}
      />
    </>
  );
}
