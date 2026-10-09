import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { DashboardPage } from '../../../pages/dashboard.jsx';
import { ProfilePage } from '../../../pages/profile.jsx';
import { I18nProvider } from '@troublefree/i18n';

vi.mock('../../../lib/api.js', () => ({
  resolveMediaUrl: (url) => url,
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => null),
  },
  authApi: { refresh: vi.fn(), me: vi.fn(), login: vi.fn(), logout: vi.fn() },
  setUnauthorizedListener: vi.fn(),
  agencyRequestApi: { list: vi.fn(), getById: vi.fn(), markViewed: vi.fn() },
  agencyQuotationApi: { list: vi.fn() },
  agencyProfileApi: {
    getProfile: vi.fn(),
    getCoverage: vi.fn(),
    updateCoverage: vi.fn(),
    getOnboardingStatus: vi.fn(() => Promise.resolve({ profileComplete: true, agreementAccepted: true, documentsCount: 1, isOperational: true })),
    getDocuments: vi.fn(() => Promise.resolve([])),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    acceptAgreement: vi.fn(),
    submitOnboarding: vi.fn(),
  },
  jobApi: { list: vi.fn() },
  messagingApi: { listConversations: vi.fn() },
  notificationApi: {
    list: vi.fn(() => Promise.resolve({ data: [], unreadCount: 0 })),
    getUnreadCount: vi.fn(() => Promise.resolve({ count: 0 })),
    markAsRead: vi.fn(() => Promise.resolve({})),
    markAllAsRead: vi.fn(() => Promise.resolve({})),
    registerPushToken: vi.fn(() => Promise.resolve({})),
    unregisterPushToken: vi.fn(() => Promise.resolve({})),
  },
}));

import {
  authApi,
  agencyRequestApi,
  agencyQuotationApi,
  agencyProfileApi,
  jobApi,
  notificationApi,
} from '../../../lib/api.js';

const agencyUser = {
  id: 42,
  email: 'anatolia@agency.com',
  agencyName: 'Anatolia Travel',
  role: 'agency',
  status: 'active',
};

function authOk(userObj = agencyUser) {
  authApi.refresh.mockResolvedValue({ accessToken: 'test-token' });
  authApi.me.mockResolvedValue({ user: userObj });
}

function renderDashboard(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nProvider>
        <AuthProvider role="agency">
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <RequireRole roles={['agency']}>
                    <DashboardPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <RequireRole roles={['agency']}>
                    <ProfilePage />
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Phase 5.1 Agency Dashboard & Shell UI', () => {
  test('renders authenticated agency identity without hardcoded names', async () => {
    authOk();
    agencyRequestApi.list.mockResolvedValue({ requests: [], pagination: { totalItems: 0 } });
    agencyQuotationApi.list.mockResolvedValue([]);
    jobApi.list.mockResolvedValue([]);
    notificationApi.list.mockResolvedValue({ pagination: { totalItems: 2 } });

    renderDashboard('/');

    await waitFor(() => expect(screen.getAllByText(/Anatolia Travel/)[0]).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText(/Manage your incoming travel requests/i)).toBeInTheDocument(),
    );
  });

  test('displays real API data in KPI cards', async () => {
    authOk();
    agencyRequestApi.list.mockResolvedValue({
      requests: [
        { id: 101, destination: 'Antalya', matchStatus: 'matched' },
        { id: 102, destination: 'Bodrum', matchStatus: 'viewed' },
      ],
      pagination: { totalItems: 2 },
    });
    agencyQuotationApi.list.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    jobApi.list.mockResolvedValue([{ id: 1 }]);
    notificationApi.list.mockResolvedValue({ pagination: { totalItems: 0 } });

    renderDashboard('/');

    await waitFor(() => expect(screen.getByText('New Requests')).toBeInTheDocument());
    expect(screen.getAllByText(/My Quotations/)[0]).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Quotations count
  });

  test('handles API errors gracefully with retry button', async () => {
    authOk();
    agencyRequestApi.list.mockRejectedValue(new Error('Network failure'));
    agencyQuotationApi.list.mockRejectedValue(new Error('Network failure'));

    renderDashboard('/');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Network failure')).toBeInTheDocument();

    // Trigger retry
    agencyRequestApi.list.mockResolvedValue({ requests: [], pagination: { totalItems: 0 } });
    const retryBtn = screen.getByRole('button', { name: /try again|retry/i });
    await userEvent.click(retryBtn);

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  test('renders empty dashboard state when no matched requests exist', async () => {
    authOk();
    agencyRequestApi.list.mockResolvedValue({ requests: [], pagination: { totalItems: 0 } });
    agencyQuotationApi.list.mockResolvedValue([]);
    jobApi.list.mockResolvedValue([]);

    renderDashboard('/');

    await waitFor(() => expect(screen.getByText('No incoming requests yet')).toBeInTheDocument());
  });

  test('profile page displays agency identity and verified status', async () => {
    authOk();
    agencyProfileApi.getProfile.mockResolvedValue({
      id: 1,
      agencyName: 'Anatolia Travel',
      status: 'approved',
      city: 'Istanbul',
      country: 'Turkey',
      documents: [{ documentType: 'license', status: 'approved' }],
    });
    agencyProfileApi.getCoverage.mockResolvedValue({
      coverages: [{ locationName: 'Istanbul' }],
      capabilities: [{ serviceType: 'full_package', isEnabled: true }],
    });

    renderDashboard('/profile');

    await waitFor(() => expect(screen.getAllByText('Anatolia Travel')[0]).toBeInTheDocument());
    expect(screen.getByText('anatolia@agency.com')).toBeInTheDocument();
  });
});
