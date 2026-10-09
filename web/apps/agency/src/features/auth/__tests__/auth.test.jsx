// Agency auth frontend tests (Phase 3).
//
// Covers the §98 Agency matrix: login/register pages, NO Google login
// entry point, protected-route redirect, role guard, logout, and
// session recovery.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../AuthContext.jsx';
import { RequireAuth, RequireRole, PublicOnly } from '../ProtectedRoute.jsx';
import { LoginPage, RegisterPage, HomePage } from '../../../pages/auth.jsx';
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
  messagingApi: {
    listConversations: vi.fn(() => Promise.resolve({ conversations: [] })),
  },
  notificationApi: {
    list: vi.fn(() => Promise.resolve({ data: [], unreadCount: 0 })),
    getUnreadCount: vi.fn(() => Promise.resolve({ count: 0 })),
    markAsRead: vi.fn(() => Promise.resolve({})),
    markAllAsRead: vi.fn(() => Promise.resolve({})),
    registerPushToken: vi.fn(() => Promise.resolve({})),
    unregisterPushToken: vi.fn(() => Promise.resolve({})),
  },
}));

const agencyUser = { id: 2, email: 'shop@example.com', role: 'agency', status: 'active' };

function renderWithAuth(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider role="agency">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <RegisterPage />
              </PublicOnly>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>{ui}</RequireRole>
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

afterEach(() => {
  delete window.google;
});

describe('session recovery', () => {
  test('valid refresh session restores the agency user', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 'fresh' });
    authApi.me.mockResolvedValue({ user: agencyUser });

    renderWithAuth(<HomePage />);

    await waitFor(() =>
      expect(screen.getByText(/Signed in as shop@example.com/)).toBeInTheDocument(),
    );
  });

  test('expired session lands on the agency login page', async () => {
    authApi.refresh.mockRejectedValue(new Error('Refresh token has expired.'));

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText('Agency sign in')).toBeInTheDocument());
  });
});

describe('login', () => {
  test('successful login navigates home', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockResolvedValue({ user: agencyUser, accessToken: 'abc' });

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText('Agency sign in')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Agency email'), 'shop@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByText(/Signed in as shop@example.com/)).toBeInTheDocument(),
    );
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'shop@example.com',
      password: 'password-123',
    });
  });

  test('no Google login entry point exists in the agency portal', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    renderWithAuth(<HomePage />, { route: '/login' });

    await waitFor(() => expect(screen.getByText('Agency sign in')).toBeInTheDocument());
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  });
});

describe('registration', () => {
  test('agency registration creates the account and navigates home', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.registerAgency.mockResolvedValue({ user: agencyUser, accessToken: 'new' });

    renderWithAuth(<HomePage />, { route: '/register' });
    await waitFor(() => expect(screen.getByText('Register your agency')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Agency name'), 'Test Agency Ltd');
    await user.type(screen.getByLabelText('Agency email'), 'shop@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.type(screen.getByLabelText('Confirm password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Register agency' }));

    await waitFor(() =>
      expect(screen.getByText(/Signed in as shop@example.com/)).toBeInTheDocument(),
    );
    expect(authApi.registerAgency).toHaveBeenCalledOnce();
    expect(authApi.registerAgency.mock.calls[0][0]).toMatchObject({
      agencyName: 'Test Agency Ltd',
      email: 'shop@example.com',
    });
  });

  test('missing agency name blocks submission without a request', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));

    renderWithAuth(<HomePage />, { route: '/register' });
    await waitFor(() => expect(screen.getByText('Register your agency')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Agency email'), 'shop@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.type(screen.getByLabelText('Confirm password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Register agency' }));

    await waitFor(() => expect(screen.getByText('Enter your agency name.')).toBeInTheDocument());
    expect(authApi.registerAgency).not.toHaveBeenCalled();
  });
});

describe('protected routes and role guard', () => {
  test('traveller identity sees access-denied in the agency portal', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({
      user: { id: 9, email: 'ada@example.com', role: 'traveller', status: 'active' },
    });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText('Access denied')).toBeInTheDocument());
    expect(screen.getByText(/requires: agency/)).toBeInTheDocument();
  });

  test('logout returns to the agency login page', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({ user: agencyUser });
    authApi.logout.mockResolvedValue({ revoked: true });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByText('Agency sign in')).toBeInTheDocument());
  });
});
