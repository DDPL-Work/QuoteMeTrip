// Traveller auth frontend tests (Phase 3).
//
// Covers the §98 Traveller matrix at the UI layer with a stubbed API
// singleton: login/register pages, Google button presence, successful
// + failed login, protected-route redirect, role guard, logout, and
// session recovery. Backend behavior is covered by the API tests.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../AuthContext.jsx';
import { useAuth } from '../auth-context.js';
import { RequireAuth, RequireRole, PublicOnly } from '../ProtectedRoute.jsx';
import { LoginPage, RegisterPage } from '../../../pages/auth.jsx';
import { apiClient, authApi } from '../../../lib/api.js';

function HomePage() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Signed in as {user?.email}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}

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

const travellerUser = { id: 1, email: 'ada@example.com', role: 'traveller', status: 'active' };

function renderWithAuth(ui, { route = '/', role = 'traveller' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider role={role}>
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
                <RequireRole roles={[role]}>{ui}</RequireRole>
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
  vi.unstubAllEnvs();
  delete window.google;
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.google;
});

describe('session recovery', () => {
  test('valid refresh session restores the user without flicker', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 'fresh' });
    authApi.me.mockResolvedValue({ user: travellerUser });

    renderWithAuth(<HomePage />);

    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument(),
    );
    expect(apiClient.setAccessToken).toHaveBeenCalledWith('fresh');
  });

  test('expired session lands on the login page', async () => {
    authApi.refresh.mockRejectedValue(new Error('Refresh token has expired.'));

    renderWithAuth(<HomePage />, { route: '/' });

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());
    expect(apiClient.clearAccessToken).toHaveBeenCalled();
  });
});

describe('login', () => {
  test('login page renders email + password fields', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    renderWithAuth(<HomePage />, { route: '/login' });

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('successful login navigates home', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockResolvedValue({ user: travellerUser, accessToken: 'abc' });

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument(),
    );
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password-123',
    });
  });

  test('invalid credentials show a friendly error and stay put', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    const failure = new Error('Invalid email or password.');
    failure.code = 'AUTH_INVALID_CREDENTIALS';
    authApi.login.mockRejectedValue(failure);

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeInTheDocument());
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  test('submit button is disabled while the request is in flight', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    let release;
    authApi.login.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ user: travellerUser, accessToken: 'x' });
      }),
    );

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled(),
    );
    release();
    await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeInTheDocument());
  });
});

describe('registration', () => {
  test('registration page creates a traveller account and navigates home', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.registerTraveller.mockResolvedValue({ user: travellerUser, accessToken: 'new' });

    renderWithAuth(<HomePage />, { route: '/register' });
    await waitFor(() => expect(screen.getByText('Create your account')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full name'), 'Ada Traveller');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.type(screen.getByLabelText('Confirm password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument(),
    );
    expect(authApi.registerTraveller).toHaveBeenCalledOnce();
  });

  test('password mismatch is caught before any request', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));

    renderWithAuth(<HomePage />, { route: '/register' });
    await waitFor(() => expect(screen.getByText('Create your account')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full name'), 'Ada Traveller');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.type(screen.getByLabelText('Confirm password'), 'different-123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('Passwords do not match.')).toBeInTheDocument());
    expect(authApi.registerTraveller).not.toHaveBeenCalled();
  });

  test('duplicate email surfaces the backend message', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.registerTraveller.mockRejectedValue(
      Object.assign(new Error('An account with this email already exists.'), {
        code: 'AUTH_EMAIL_ALREADY_EXISTS',
      }),
    );

    renderWithAuth(<HomePage />, { route: '/register' });
    await waitFor(() => expect(screen.getByText('Create your account')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full name'), 'Ada Traveller');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.type(screen.getByLabelText('Confirm password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument(),
    );
  });
});

describe('protected routes and role guard', () => {
  test('authenticated page renders for the right role', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({ user: travellerUser });

    renderWithAuth(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument(),
    );
  });

  test('wrong role sees access-denied instead of a login loop', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({
      user: { ...travellerUser, email: 'shop@example.com', role: 'agency' },
    });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText('Access denied')).toBeInTheDocument());
    expect(screen.getByText(/requires: traveller/)).toBeInTheDocument();
  });

  test('logout returns to the login page', async () => {
    const user = userEvent.setup({ delay: null });
    authApi.refresh.mockResolvedValue({ accessToken: 't' });
    authApi.me.mockResolvedValue({ user: travellerUser });
    authApi.logout.mockResolvedValue({ revoked: true });

    renderWithAuth(<HomePage />);
    await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());
    expect(authApi.logout).toHaveBeenCalledOnce();
  });
});

describe('google login button', () => {
  test('hidden when no client ID is configured', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    authApi.refresh.mockRejectedValue(new Error('no session'));
    renderWithAuth(<HomePage />, { route: '/login' });

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument();
  });

  test('completes sign-in when Google is configured', async () => {
    const user = userEvent.setup({ delay: null });
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn((element) => {
            const button = document.createElement('button');
            button.textContent = 'Sign in with Google';
            button.addEventListener('click', () => {
              const options = window.google.accounts.id.initialize.mock.calls[0][0];
              options.callback({ credential: 'fake-google-id-token' });
            });
            element.appendChild(button);
          }),
        },
      },
    };
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.googleLogin.mockResolvedValue({ user: travellerUser, accessToken: 'g123' });

    renderWithAuth(<HomePage />, { route: '/login' });
    await waitFor(() => expect(screen.getByTestId('google-login-button')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => expect(authApi.googleLogin).toHaveBeenCalledWith('fake-google-id-token'));
    await waitFor(() =>
      expect(screen.getByText(/Signed in as ada@example.com/)).toBeInTheDocument(),
    );
  });
});
