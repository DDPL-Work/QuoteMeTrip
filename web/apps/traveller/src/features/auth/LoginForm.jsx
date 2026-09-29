// Traveller login form (Phase 3).
//
// Frontend validation is UX only — the backend re-validates everything
// and returns user-safe error messages, which are shown verbatim.

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField, PasswordInput, LoadingButton, AuthError } from '@troublefree/ui';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';
import { GoogleLoginButton } from './GoogleLoginButton.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function getSafeRedirect(target) {
  if (!target || typeof target !== 'string') return '/';
  const trimmed = target.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('://')
  ) {
    return trimmed;
  }
  return '/';
}

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
      const searchParams = new URLSearchParams(location.search);
      const rawRedirect = searchParams.get('redirect') || location.state?.from || '/';
      const redirect = getSafeRedirect(rawRedirect);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(friendlyAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField id="email" label="Email" error={fieldErrors.email}>
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
      <AuthError error={error} />
      <LoadingButton loading={submitting}>Sign in</LoadingButton>
      <GoogleLoginButton onError={setError} />
      <p className="auth-switch">
        New here? <Link to="/register">Create a traveller account</Link>
      </p>
    </form>
  );
}
