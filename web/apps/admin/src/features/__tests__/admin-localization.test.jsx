import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { I18nProvider, useI18n } from '@troublefree/i18n';
import { AuthProvider } from '../auth/AuthContext.jsx';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import { DashboardPage } from '../../pages/DashboardPage.jsx';
import { AgenciesPage } from '../../pages/AgenciesPage.jsx';
import { MembershipsPage } from '../../pages/MembershipsPage.jsx';
import { MembershipPlansPage } from '../../pages/MembershipPlansPage.jsx';
import { CommissionsPage } from '../../pages/CommissionsPage.jsx';
import { AnnouncementsPage } from '../../pages/AnnouncementsPage.jsx';
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
    createMembershipPlan: vi.fn(),
    updateMembershipPlan: vi.fn(),
    deleteMembershipPlan: vi.fn(),
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
    listAnnouncements: vi.fn(),
    getAnnouncementStats: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    publishAnnouncement: vi.fn(),
    withdrawAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
  },
}));

const adminUser = { id: 1, email: 'admin@troublefree.com', role: 'admin', status: 'active' };

function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div data-testid="locale-switcher">
      <span data-testid="current-locale">{locale}</span>
      <button type="button" onClick={() => setLocale('tr')}>
        Switch to TR
      </button>
      <button type="button" onClick={() => setLocale('en')}>
        Switch to EN
      </button>
    </div>
  );
}

function renderAdminApp(ui, { route = '/', initialLocale = 'en' } = {}) {
  authApi.refresh.mockResolvedValue({ accessToken: 'test-token' });
  authApi.me.mockResolvedValue({ user: adminUser });
  localStorage.setItem('tf_locale', initialLocale);

  return render(
    <I18nProvider initialLocale={initialLocale}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider role="admin">
          <LocaleSwitcher />
          {ui}
        </AuthProvider>
      </MemoryRouter>
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Admin Portal Complete Localization (EN / TR)', () => {
  test('1. Dashboard and Sidebar render completely in English by default', async () => {
    adminApi.getDashboardMetrics.mockResolvedValue({
      agencies: { pending: 3, approved: 12, suspended: 1, total: 16 },
      memberships: { pending: 2, active: 10, expired: 3, total: 15 },
      marketplace: { totalRequests: 30, activeJobs: 6, completedJobs: 20 },
      commissions: { totalCommissionAmount: 3450.0, pendingAmount: 450.0, paidAmount: 3000.0 },
    });

    renderAdminApp(
      <AdminLayout>
        <DashboardPage />
      </AdminLayout>,
    );

    await waitFor(() => {
      // Sidebar English labels
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Agencies')).toBeInTheDocument();
      expect(screen.getAllByText('Memberships')[0]).toBeInTheDocument();
      expect(screen.getByText('Membership Plans')).toBeInTheDocument();
      expect(screen.getByText('Commissions')).toBeInTheDocument();
      expect(screen.getAllByText('Travel Requests')[0]).toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();

      // Dashboard header & greeting
      expect(screen.getByText('Good afternoon, Admin')).toBeInTheDocument();

      // KPI cards in English
      expect(screen.getByText('Total Agencies')).toBeInTheDocument();
      expect(screen.getByText('Active Memberships')).toBeInTheDocument();
      expect(screen.getByText('Total Commissions')).toBeInTheDocument();

      // Attention alerts in English
      expect(screen.getByText('Operational Attention Needed')).toBeInTheDocument();
      expect(screen.getByText('Review Agencies')).toBeInTheDocument();
      expect(screen.getByText('Confirm Payments')).toBeInTheDocument();
    });
  });

  test('2. Language toggle switches the entire Admin Dashboard and Sidebar to Turkish', async () => {
    adminApi.getDashboardMetrics.mockResolvedValue({
      agencies: { pending: 2, approved: 10, suspended: 1, total: 13 },
      memberships: { pending: 1, active: 8, expired: 2, total: 11 },
      marketplace: { totalRequests: 25, activeJobs: 5, completedJobs: 15 },
      commissions: { totalCommissionAmount: 1250.0, pendingAmount: 250.0, paidAmount: 1000.0 },
    });

    renderAdminApp(
      <AdminLayout>
        <DashboardPage />
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Agencies')).toBeInTheDocument();
    });

    // Switch to TR
    fireEvent.click(screen.getByText('Switch to TR'));

    await waitFor(() => {
      // Sidebar Turkish labels
      expect(screen.getByText('Kontrol Paneli')).toBeInTheDocument();
      expect(screen.getByText('Acenteler')).toBeInTheDocument();
      expect(screen.getByText('Üyelikler')).toBeInTheDocument();
      expect(screen.getByText('Üyelik Planları')).toBeInTheDocument();
      expect(screen.getByText('Komisyonlar')).toBeInTheDocument();
      expect(screen.getAllByText('Seyahat Talepleri')[0]).toBeInTheDocument();
      expect(screen.getByText('İşler')).toBeInTheDocument();
      expect(screen.getByText('Duyurular ve Bildirimler')).toBeInTheDocument();
      expect(screen.getByText('Denetim Kayıtları')).toBeInTheDocument();

      // Dashboard greeting & header in Turkish
      expect(screen.getByText('İyi günler, Yönetici')).toBeInTheDocument();

      // KPI cards in Turkish
      expect(screen.getByText('Toplam Acente')).toBeInTheDocument();
      expect(screen.getAllByText('Aktif Üyelikler')[0]).toBeInTheDocument();
      expect(screen.getByText('Toplam Komisyon')).toBeInTheDocument();

      // Attention section in Turkish
      expect(screen.getByText('Operasyonel Dikkat Gerekenler')).toBeInTheDocument();
      expect(screen.getByText('Acenteleri İncele')).toBeInTheDocument();
      expect(screen.getByText('Ödemeleri Onayla')).toBeInTheDocument();
    });

    // Verify localStorage persistence
    expect(localStorage.getItem('tf_locale')).toBe('tr');
  });

  test('3. AgenciesPage renders in Turkish when locale is tr', async () => {
    adminApi.listAgencies.mockResolvedValue({
      items: [
        {
          id: 5,
          agencyName: 'Kapadokya Balon Turizm',
          contactPerson: 'Ali Veli',
          businessEmail: 'ali@kapadokya.com',
          status: 'pending',
          city: 'Nevşehir',
          country: 'Türkiye',
          documents: [{}, {}],
        },
      ],
      pagination: { page: 1, totalPages: 1, totalItems: 1 },
    });

    renderAdminApp(<AgenciesPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      // Page titles in Turkish
      expect(screen.getByText('Acente Dizini ve Onay Yönetimi')).toBeInTheDocument();

      // Table headers in Turkish
      expect(screen.getByText('İletişim / E-posta')).toBeInTheDocument();
      expect(screen.getByText('Konum')).toBeInTheDocument();
      expect(screen.getByText('Üyelikler')).toBeInTheDocument();
      expect(screen.getByText('İşlemler')).toBeInTheDocument();

      // Agency data & Turkish status badge
      expect(screen.getByText('Kapadokya Balon Turizm')).toBeInTheDocument();
      expect(screen.getAllByText('Beklemede')[0]).toBeInTheDocument();
    });
  });

  test('4. MembershipsPage renders in Turkish when locale is tr', async () => {
    adminApi.listMemberships.mockResolvedValue({
      items: [
        {
          id: 10,
          agency: { agencyName: 'Ege Seyahat' },
          plan: { name: 'Standart Plan', price: 1500.0 },
          status: 'pending',
          startsAt: '2026-09-01',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });

    renderAdminApp(<MembershipsPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      expect(screen.getByText('Acente Üyelik Yönetimi ve Ödemeler')).toBeInTheDocument();
      expect(screen.getByText('Ödemeyi Onayla')).toBeInTheDocument();
      expect(screen.getByText('Geçerlilik Süresi')).toBeInTheDocument();
    });
  });

  test('5. MembershipPlansPage renders in Turkish when locale is tr', async () => {
    adminApi.listMembershipPlans.mockResolvedValue([
      {
        id: 1,
        name: 'Kurumsal Plan',
        price: 4999.0,
        billingCycle: 'monthly',
        durationDays: 30,
        quoteLimit: null,
        commissionRate: 5.0,
        isActive: true,
      },
    ]);

    renderAdminApp(<MembershipPlansPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      expect(screen.getByText('Üyelik Planları ve Paketler')).toBeInTheDocument();
      expect(screen.getByText('Yeni Plan Oluştur')).toBeInTheDocument();
      expect(screen.getByText('Aktif')).toBeInTheDocument();
    });
  });

  test('6. CommissionsPage renders in Turkish when locale is tr', async () => {
    adminApi.getCommissionSummary.mockResolvedValue({
      totalCommission: 8500.0,
      pendingCommission: 1200.0,
      paidCommission: 7300.0,
    });
    adminApi.listCommissions.mockResolvedValue({
      items: [],
      pagination: { page: 1, totalPages: 1 },
    });

    renderAdminApp(<CommissionsPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      expect(screen.getByText('Toplam Kazanılan')).toBeInTheDocument();
      expect(screen.getByText('Ödenen')).toBeInTheDocument();
    });
  });

  test('7. AnnouncementsPage renders in Turkish when locale is tr', async () => {
    adminApi.listAnnouncements.mockResolvedValue({
      items: [],
      pagination: { page: 1, totalPages: 1, totalItems: 0 },
    });

    renderAdminApp(<AnnouncementsPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      expect(screen.getByText('Duyuru Merkezi')).toBeInTheDocument();
      expect(screen.getByText('Yeni Duyuru')).toBeInTheDocument();
    });
  });

  test('8. AuditLogsPage renders in Turkish when locale is tr', async () => {
    adminApi.listAuditLogs.mockResolvedValue({
      items: [
        {
          id: 1,
          createdAt: '2026-10-26T12:00:00Z',
          action: 'agency.approved',
          entityType: 'agency',
          entityId: 5,
          user: { email: 'admin@troublefree.com' },
          details: {},
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });

    renderAdminApp(<AuditLogsPage />, { initialLocale: 'tr' });

    await waitFor(() => {
      expect(screen.getByText('Yönetici Denetim Kayıtları')).toBeInTheDocument();
      expect(screen.getByText('Zaman')).toBeInTheDocument();
      expect(screen.getByText('İşlem')).toBeInTheDocument();
      expect(screen.getByText('Hedef Varlık')).toBeInTheDocument();
    });
  });
});
