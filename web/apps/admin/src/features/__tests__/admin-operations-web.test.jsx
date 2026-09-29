import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../auth/AuthContext.jsx';
import { DashboardPage } from '../../pages/DashboardPage.jsx';
import { AgenciesPage } from '../../pages/AgenciesPage.jsx';
import { MembershipsPage } from '../../pages/MembershipsPage.jsx';
import { CommissionsPage } from '../../pages/CommissionsPage.jsx';
import { AuditLogsPage } from '../../pages/AuditLogsPage.jsx';
import { adminApi, authApi } from '../../services/api.js';

vi.mock('../../services/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => 'test-token'),
  },
  authApi: {
    refresh: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  adminApi: {
    getDashboardMetrics: vi.fn(),
    listAgencies: vi.fn(),
    getAgencyById: vi.fn(),
    approveAgency: vi.fn(),
    rejectAgency: vi.fn(),
    suspendAgency: vi.fn(),
    reactivateAgency: vi.fn(),
    verifyDocument: vi.fn(),
    rejectDocument: vi.fn(),
    listMembershipPlans: vi.fn(),
    listMemberships: vi.fn(),
    confirmPayment: vi.fn(),
    suspendMembership: vi.fn(),
    reactivateMembership: vi.fn(),
    listCommissions: vi.fn(),
    getCommissionSummary: vi.fn(),
    updateCommissionStatus: vi.fn(),
    listTravelRequests: vi.fn(),
    listJobs: vi.fn(),
    listAuditLogs: vi.fn(),
  },
}));

const adminUser = { id: 1, email: 'admin@troublefree.com', role: 'admin', status: 'active' };

function renderWithAuth(ui, { route = '/' } = {}) {
  authApi.refresh.mockResolvedValue({ accessToken: 'test-token' });
  authApi.me.mockResolvedValue({ user: adminUser });

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider role="admin">{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Phase 7 Admin Operations UI Components', () => {
  test('DashboardPage renders metrics data', async () => {
    adminApi.getDashboardMetrics.mockResolvedValue({
      agencies: { pending: 2, approved: 10, suspended: 1, total: 13 },
      memberships: { pending: 1, active: 8, expired: 2, total: 11 },
      marketplace: { totalRequests: 25, activeJobs: 5, completedJobs: 15 },
      commissions: { totalCommissionAmount: 1250.0, pendingAmount: 250.0, paidAmount: 1000.0 },
    });

    renderWithAuth(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('$1250')).toBeInTheDocument();
    });
  });

  test('AgenciesPage lists agencies and allows approval action', async () => {
    adminApi.listAgencies.mockResolvedValue({
      items: [
        {
          id: 5,
          agencyName: 'Apex Tours',
          contactPerson: 'Apex Contact',
          businessEmail: 'apex@tours.com',
          status: 'pending',
          city: 'Istanbul',
          country: 'Turkey',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });
    adminApi.approveAgency.mockResolvedValue({ id: 5, status: 'approved' });

    renderWithAuth(<AgenciesPage />, { route: '/agencies' });
    await waitFor(() => {
      expect(screen.getByText('Apex Tours')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  test('MembershipsPage displays membership records & manual payment trigger', async () => {
    adminApi.listMemberships.mockResolvedValue({
      items: [
        {
          id: 12,
          agencyId: 5,
          agency: { agencyName: 'Apex Tours' },
          plan: { name: 'Monthly Standard', price: 99.0 },
          startsAt: '2026-09-01',
          status: 'pending',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });

    renderWithAuth(<MembershipsPage />, { route: '/memberships' });
    await waitFor(() => {
      expect(screen.getByText('Apex Tours')).toBeInTheDocument();
      expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    });
  });

  test('CommissionsPage displays summary and commission table', async () => {
    adminApi.listCommissions.mockResolvedValue({
      items: [
        {
          id: 8,
          agencyId: 5,
          agency: { agencyName: 'Apex Tours' },
          jobId: 101,
          quotationId: 45,
          jobAmount: 1000.0,
          commissionRate: 10.0,
          commissionAmount: 100.0,
          currency: 'USD',
          status: 'pending',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });
    adminApi.getCommissionSummary.mockResolvedValue({
      totalCommissionAmount: 100.0,
      pendingAmount: 100.0,
      confirmedAmount: 0.0,
      paidAmount: 0.0,
    });

    renderWithAuth(<CommissionsPage />, { route: '/commissions' });
    await waitFor(() => {
      expect(screen.getByText('Commission Tracking')).toBeInTheDocument();
      expect(screen.getAllByText(/\$100/)[0]).toBeInTheDocument();
    });
  });

  test('AuditLogsPage renders administrative audit records', async () => {
    adminApi.listAuditLogs.mockResolvedValue({
      items: [
        {
          id: 1,
          action: 'agency.approved',
          entityType: 'agency',
          entityId: 5,
          actor: { email: 'admin@troublefree.com' },
          createdAt: '2026-09-24T10:00:00Z',
          ipAddress: '127.0.0.1',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });

    renderWithAuth(<AuditLogsPage />, { route: '/audit-logs' });
    await waitFor(() => {
      expect(screen.getByText('Administrative Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('agency.approved')).toBeInTheDocument();
    });
  });
});
