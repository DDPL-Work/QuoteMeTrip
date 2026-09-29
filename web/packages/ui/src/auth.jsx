// @troublefree/ui — shared authentication primitives (Phase 3).
//
// Reusable, unbranded auth UI used by the Traveller, Agency, and Admin
// apps: layout, form field, password input, loading button, and error
// display. Application-specific forms and pages stay in each app.

import { useState } from 'react';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label={title}>
        <h1>{title}</h1>
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
      </section>
    </main>
  );
}

export function FormField({ id, label, error, children }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordInput({
  id,
  name,
  autoComplete = 'current-password',
  required = true,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        minLength={8}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={disabled}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function LoadingButton({ loading, children, ...props }) {
  return (
    <button type="submit" className="auth-submit" disabled={loading || props.disabled} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export function AuthError({ error }) {
  if (!error) return null;
  return (
    <p className="auth-error" role="alert">
      {error}
    </p>
  );
}
