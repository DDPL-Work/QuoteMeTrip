// Traveller auth pages (Phase 3) — thin wrappers around the shared
// UI shell and the auth forms. No business dashboard yet.

import { Link } from 'react-router-dom';
import { AuthLayout } from '@troublefree/ui';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';
import { useAuth } from '../features/auth/auth-context.js';

export function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Traveller account.">
      <LoginForm />
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Plan trouble-free holidays.">
      <RegisterForm />
    </AuthLayout>
  );
}
