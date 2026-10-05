// Admin login form (Phase 3).
//
// Admin accounts are provisioned via `npm run admin:create` — there is
// deliberately no registration form, link, or route in this app.

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormField, PasswordInput, LoadingButton, AuthError } from '@troublefree/ui';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    const next = {};
    if (!EMAIL_PATTERN.test(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setError('');
    try {
      await login({ email, password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(friendlyAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField id="email" label="Admin email" error={fieldErrors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@QuoteMeTrip.com"
          required
          disabled={submitting}
        />
      </FormField>
      <FormField id="password" label="Password" error={fieldErrors.password}>
        <PasswordInput id="password" name="password" disabled={submitting} />
      </FormField>
      <AuthError error={error} />
      <LoadingButton loading={submitting}>Sign in to Admin Console</LoadingButton>

      <div className="auth-security-notice">
        <svg className="auth-security-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>
          Encrypted administrative session. System activity is monitored and logged for security
          audits.
        </span>
      </div>
    </form>
  );
}
