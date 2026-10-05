// Admin auth frontend tests (Phase 3).
//
// Covers the §98 Admin matrix: login page, NO public registration
// (route redirects to /login), successful + failed login, role
// protection, logout, and session recovery.

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '../AuthContext.jsx';
import { RequireAuth, RequireRole, PublicOnly } from '../ProtectedRoute.jsx';
import { LoginPage, HomePage } from '../../../pages/auth.jsx';
import { authApi } from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => null),
  },
  authApi: {
    refresh: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    registerTraveller: vi.fn(),
    registerAgency: vi.fn(),
    googleLogin: vi.fn(),
  },
  setUnauthorizedListener: vi.fn(),
}));

const adminUser = { id: 3, email: 'ops@example.com', role: 'admin', status: 'active' };

function renderWithAuth(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider role="admin">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireRole roles={['admin']}>{ui}</RequireRole>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('session recovery', () => {
  test('valid refresh session restores the admin user', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 'fresh' });
    authApi.me.mockResolvedValue({ user: adminUser });

    renderWithAuth(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText(/Signed in as ops@example.com/)).toBeInTheDocument(),
    );
  });

  test('expired session lands on the admin login page', async () => {
    authApi.refresh.mockRejectedValue(new Error('Refresh token has expired.'));

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());
  });
});

describe('login', () => {
  test('successful login navigates home', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockResolvedValue({ user: adminUser, accessToken: 'abc' });

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText('Admin email'), 'ops@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/Signed in as ops@example.com/)).toBeInTheDocument(),
    );
  });

  test('invalid credentials show a friendly error', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockRejectedValue(new Error('Invalid email or password.'));

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText('Admin email'), 'ops@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeInTheDocument());
  });
});

describe('no public registration', () => {
  test('/register redirects to /login', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    renderWithAuth(<HomePage />, { route: '/register' });

    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
  });

  test('login page offers no registration entry point', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    renderWithAuth(<HomePage />, { route: '/login' });

    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());
    expect(screen.queryByText(/create.*account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });
});

describe('role protection', () => {
  test('non-admin identity sees access-denied', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({
      user: { id: 9, email: 'ada@example.com', role: 'traveller', status: 'active' },
    });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText('Access denied')).toBeInTheDocument());
    expect(screen.getByText(/requires: admin/)).toBeInTheDocument();
  });

  test('logout returns to the admin login page', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({ user: adminUser });
    authApi.logout.mockResolvedValue({ revoked: true });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByText(/Admin Operations Sign In/i)).toBeInTheDocument());
    expect(authApi.logout).toHaveBeenCalledOnce();
  });
});
