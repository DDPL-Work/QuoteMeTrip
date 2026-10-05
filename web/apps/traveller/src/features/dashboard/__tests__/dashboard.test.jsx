import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from '../../auth/AuthContext.jsx';
import { DashboardPage } from '../../../pages/dashboard.jsx';
import { travelRequestApi, jobApi, messagingApi, notificationApi } from '../../../lib/api.js';

vi.mock('@troublefree/i18n', () => ({
  I18nProvider: ({ children }) => <>{children}</>,
  useI18n: () => ({
    t: (key, vars) => {
      if (key === 'dashboard.welcome') return `Good morning, ${vars.name}`;
      if (key === 'dashboard.action.empty.title') return 'Plan your first trip';
      if (key === 'dashboard.action.draft.title') return 'Continue your trip';
      if (key === 'dashboard.empty.requests') return 'No requests yet.';
      if (key === 'dashboard.empty.jobs') return 'No active trips yet.';
      return key;
    },
  }),
}));

vi.mock('../../../lib/api.js', () => ({
  travelRequestApi: {
    list: vi.fn(),
  },
  jobApi: {
    list: vi.fn(),
  },
  messagingApi: {
    listConversations: vi.fn(),
  },
  notificationApi: {
    getUnreadCount: vi.fn(),
  },
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => 'mock-token'),
  },
  authApi: {
    refresh: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    me: vi.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'traveller',
        firstName: 'Ashish',
      },
    }),
  },
  setUnauthorizedListener: vi.fn(),
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nProvider>
        <AuthProvider role="traveller">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardPhase3', () => {
  test('renders dashboard successfully with empty data', async () => {
    travelRequestApi.list.mockResolvedValue([]);
    jobApi.list.mockResolvedValue([]);
    messagingApi.listConversations.mockResolvedValue([]);
    notificationApi.getUnreadCount.mockResolvedValue({ count: 0 });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/dashboard\.welcome|Ashish/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Plan your first trip')).toBeInTheDocument();
    expect(screen.getByText('No requests yet.')).toBeInTheDocument();
    expect(screen.getByText('No active trips yet.')).toBeInTheDocument();
  });

  test('renders dashboard with populated data', async () => {
    travelRequestApi.list.mockResolvedValue([
      { id: 101, status: 'draft', route: { title: 'Turkey Journey' } },
    ]);
    jobApi.list.mockResolvedValue([
      { id: 201, status: 'in_progress', agency: { agencyName: 'Anatolia' } },
    ]);
    messagingApi.listConversations.mockResolvedValue([
      { id: 301, lastMessage: { body: 'Hello' }, agency: { agencyName: 'Anatolia' } },
    ]);
    notificationApi.getUnreadCount.mockResolvedValue({ count: 5 });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Turkey Journey/i)).toBeInTheDocument();
    });

    // Check draft priority action
    expect(screen.getByText('Continue your trip')).toBeInTheDocument();

    // Check data rendering
    expect(screen.getByText(/Request #101/i)).toBeInTheDocument();
    expect(screen.getByText(/Trip #201/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello/i)).toBeInTheDocument();
  });
});
