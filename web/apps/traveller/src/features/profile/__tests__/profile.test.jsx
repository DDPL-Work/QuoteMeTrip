// Traveller Profile frontend tests (Phase 2).

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { ProfilePage } from '../../../pages/profile.jsx';
import { apiClient, authApi, travellerApi } from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => 'mock-access-token'),
  },
  authApi: {
    refresh: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
  },
  travellerApi: {
    me: vi.fn(),
    updateMe: vi.fn(),
  },
  setUnauthorizedListener: vi.fn(),
}));

const mockUser = {
  id: 1,
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  role: 'traveller',
  status: 'active',
};

const mockProfile = {
  id: 1,
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  role: 'traveller',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+905551234567',
  dateOfBirth: '1995-05-15',
  gender: 'female',
  country: 'Turkey',
  city: 'Istanbul',
  preferredLocale: 'en',
};

function renderProfilePage() {
  authApi.refresh.mockResolvedValue({ accessToken: 'mock-access-token' });
  authApi.me.mockResolvedValue({ user: mockUser });

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider role="traveller">
        <Routes>
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <RequireRole roles={['traveller']}>
                  <ProfilePage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProfilePage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('1. Loads and renders profile data successfully', async () => {
    travellerApi.me.mockResolvedValue({ profile: mockProfile });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument();
    });
    expect(screen.getByText('+905551234567')).toBeInTheDocument();
    expect(screen.getByText('1995-05-15')).toBeInTheDocument();
    expect(screen.getByText('Istanbul')).toBeInTheDocument();
    expect(screen.getByText('Turkey')).toBeInTheDocument();
  });

  test('2. Displays error state when profile fails to load and allows retry', async () => {
    travellerApi.me.mockRejectedValueOnce(new Error('Network error loading profile.'));

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Could not load profile')).toBeInTheDocument();
    });
    expect(screen.getByText('Network error loading profile.')).toBeInTheDocument();

    travellerApi.me.mockResolvedValueOnce({ profile: mockProfile });
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument();
    });
  });

  test('3. Toggles edit mode and updates profile successfully via PATCH', async () => {
    const user = userEvent.setup({ delay: null });
    travellerApi.me.mockResolvedValue({ profile: mockProfile });

    const updatedProfile = {
      ...mockProfile,
      firstName: 'Adaline',
      lastName: 'Lovelace',
      city: 'Ankara',
    };
    travellerApi.updateMe.mockResolvedValue({ profile: updatedProfile });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    expect(screen.getByLabelText('First Name')).toHaveValue('Ada');
    expect(screen.getByLabelText('City')).toHaveValue('Istanbul');

    await user.clear(screen.getByLabelText('First Name'));
    await user.type(screen.getByLabelText('First Name'), 'Adaline');

    await user.clear(screen.getByLabelText('City'));
    await user.type(screen.getByLabelText('City'), 'Ankara');

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(travellerApi.updateMe).toHaveBeenCalledWith({
        firstName: 'Adaline',
        lastName: 'Lovelace',
        phone: '+905551234567',
        dateOfBirth: '1995-05-15',
        gender: 'female',
        country: 'Turkey',
        city: 'Ankara',
        preferredLocale: 'en',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Profile saved successfully\./)).toBeInTheDocument();
    });
    expect(screen.getByText('Ankara')).toBeInTheDocument();
  });

  test('4. Canceling edit resets form fields to saved profile data', async () => {
    const user = userEvent.setup({ delay: null });
    travellerApi.me.mockResolvedValue({ profile: mockProfile });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    await user.clear(screen.getByLabelText('First Name'));
    await user.type(screen.getByLabelText('First Name'), 'ModifiedName');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument();
  });

  test('5. Sign out from all devices triggers confirmation dialog and logoutAll call', async () => {
    const user = userEvent.setup({ delay: null });
    travellerApi.me.mockResolvedValue({ profile: mockProfile });
    authApi.logoutAll.mockResolvedValue({ revoked: 3 });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign out from all devices' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sign out from all devices' }));

    expect(screen.getByText('Sign out from all devices?')).toBeInTheDocument();
    expect(
      screen.getByText(/This action will end your active sessions on all other devices/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out everywhere' }));

    await waitFor(() => {
      expect(authApi.logoutAll).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
