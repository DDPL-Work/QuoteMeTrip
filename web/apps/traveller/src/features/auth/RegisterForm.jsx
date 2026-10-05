// Traveller registration form (Phase 3).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField, PasswordInput, LoadingButton, AuthError } from '@troublefree/ui';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';
import { authApi } from '../../lib/api.js';

import { getSafeRedirect } from './LoginForm.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
      passwordConfirm: String(form.get('passwordConfirm') || ''),
      firstName: String(form.get('firstName') || '').trim() || undefined,
      lastName: String(form.get('lastName') || '').trim() || undefined,
      phone: String(form.get('phone') || '').trim() || undefined,
    };

    const next = {};
    if (!input.name) next.name = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(input.email)) next.email = 'Enter a valid email address.';
    if (input.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (input.passwordConfirm !== input.password) next.passwordConfirm = 'Passwords do not match.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setError('');
    try {
      await register(() => authApi.registerTraveller(input));
      const searchParams = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : '',
      );
      const rawRedirect = searchParams.get('redirect') || '/';
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
      <FormField id="name" label="Full name" error={fieldErrors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={submitting}
        />
      </FormField>
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
      <FormField id="phone" label="Contact number (Phone / WhatsApp)" error={fieldErrors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+90 555 123 4567"
          disabled={submitting}
        />
      </FormField>
      <FormField id="firstName" label="First name (optional)">
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          disabled={submitting}
        />
      </FormField>
      <FormField id="lastName" label="Last name (optional)">
        <input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="family-name"
          disabled={submitting}
        />
      </FormField>
      <FormField id="password" label="Password" error={fieldErrors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          disabled={submitting}
        />
      </FormField>
      <FormField id="passwordConfirm" label="Confirm password" error={fieldErrors.passwordConfirm}>
        <PasswordInput
          id="passwordConfirm"
          name="passwordConfirm"
          autoComplete="new-password"
          disabled={submitting}
        />
      </FormField>
      <AuthError error={error} />
      <LoadingButton loading={submitting}>Create account</LoadingButton>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
