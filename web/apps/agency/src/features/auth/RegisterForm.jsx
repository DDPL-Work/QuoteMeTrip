// Agency registration form (Phase 3).
//
// Creates users(role=agency) + agency_profiles in one transaction.
// Approval/membership activation belongs to later business phases.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField, PasswordInput, LoadingButton, AuthError, toast } from '@troublefree/ui';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';
import { authApi } from '../../lib/api.js';

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
      agencyName: String(form.get('agencyName') || '').trim(),
      contactPerson: String(form.get('contactPerson') || '').trim() || undefined,
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
      passwordConfirm: String(form.get('passwordConfirm') || ''),
      phone: String(form.get('phone') || '').trim() || undefined,
      city: String(form.get('city') || '').trim() || undefined,
      country: String(form.get('country') || '').trim() || undefined,
    };

    const next = {};
    if (!input.agencyName) next.agencyName = 'Enter your agency name.';
    if (!EMAIL_PATTERN.test(input.email)) next.email = 'Enter a valid agency email address.';
    if (input.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (input.passwordConfirm !== input.password) next.passwordConfirm = 'Passwords do not match.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(Object.values(next)[0]);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await register(() => authApi.registerAgency(input));
      toast.success('Registration submitted successfully');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = friendlyAuthMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField id="agencyName" label="Agency name" error={fieldErrors.agencyName}>
        <input
          id="agencyName"
          name="agencyName"
          type="text"
          autoComplete="organization"
          required
          disabled={submitting}
        />
      </FormField>
      <FormField id="contactPerson" label="Contact person (optional)">
        <input
          id="contactPerson"
          name="contactPerson"
          type="text"
          autoComplete="name"
          disabled={submitting}
        />
      </FormField>
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
      <FormField id="phone" label="Phone (optional)">
        <input id="phone" name="phone" type="tel" autoComplete="tel" disabled={submitting} />
      </FormField>
      <FormField id="city" label="City (optional)">
        <input
          id="city"
          name="city"
          type="text"
          autoComplete="address-level2"
          disabled={submitting}
        />
      </FormField>
      <FormField id="country" label="Country (optional)">
        <input
          id="country"
          name="country"
          type="text"
          autoComplete="country-name"
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
      <LoadingButton loading={submitting}>Register agency</LoadingButton>
      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
