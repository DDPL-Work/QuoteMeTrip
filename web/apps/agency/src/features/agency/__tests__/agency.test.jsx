// Agency Phase 5 frontend tests: inbox, detail, quotation form, draft save, submit.

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { IncomingRequestsPage } from '../../../pages/incoming-requests.jsx';
import { AgencyRequestDetailPage } from '../../../pages/request-detail.jsx';
import { CreateQuotationPage } from '../../../pages/create-quotation.jsx';
import { QuotationDetailPage } from '../../../pages/quotation-detail.jsx';
import { QuotationForm } from '../../../components/QuotationForm.jsx';
import { QuotationTotals } from '../../../components/QuotationTotals.jsx';

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
  agencyQuotationApi: {
    createForRequest: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    withdraw: vi.fn(),
  },
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

import { authApi, agencyRequestApi, agencyQuotationApi } from '../../../lib/api.js';

const agencyUser = { id: 2, email: 'shop@example.com', role: 'agency', status: 'active' };

function authOk() {
  authApi.refresh.mockResolvedValue({ accessToken: 'a' });
  authApi.me.mockResolvedValue({ user: agencyUser });
}

function renderGuarded(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider role="agency">
        <Routes>
          <Route
            path="/requests"
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>
                  <IncomingRequestsPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/requests/:id"
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>
                  <AgencyRequestDetailPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/requests/:id/quotations/new"
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>
                  <CreateQuotationPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>
                  <QuotationDetailPage />
                </RequireRole>
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

describe('agency inbox', () => {
  test('list renders matched requests with default active filter', async () => {
    authOk();
    agencyRequestApi.list.mockResolvedValue({
      requests: [
        {
          id: 11,
          destination: 'Paris',
          status: 'submitted',
          matchStatus: 'matched',
          traveller: { firstName: 'Ada' },
        },
      ],
      pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: 1 },
    });
    renderGuarded('/requests');
    await waitFor(() => expect(screen.getByText(/Request #11/)).toBeInTheDocument());
    expect(agencyRequestApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ matchStatus: undefined }),
    );
  });

  test('detail shows traveller first name and create-quotation entry', async () => {
    authOk();
    agencyRequestApi.getById.mockResolvedValue({
      request: {
        id: 11,
        destination: 'Paris',
        status: 'submitted',
        matchStatus: 'matched',
        traveller: { firstName: 'Ada' },
      },
      match: { matchStatus: 'matched' },
    });
    renderGuarded('/requests/11');
    await waitFor(() => expect(screen.getByText('Traveller: Ada')).toBeInTheDocument());
    expect(screen.getByText('Create quotation').closest('a')).toHaveAttribute(
      'href',
      '/requests/11/quotations/new',
    );
    expect(screen.queryByText(/ada@example\.com/i)).not.toBeInTheDocument();
  });
});

describe('quotation form', () => {
  test('validation blocks submit without a quotation type', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <QuotationForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(screen.getByText('Select a quotation type.')).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('item totals display live quantity × price', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <QuotationTotals items={[{ title: 'Hotel', quantity: 2, unitPrice: 50 }]} currency="USD" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('items-total')).toHaveTextContent('Total: 100 USD');
    void user;
  });

  test('draft save sends no totals and navigates to the quotation', async () => {
    const user = userEvent.setup({ delay: null });
    authOk();
    agencyQuotationApi.createForRequest.mockResolvedValue({
      quotation: { id: 5, status: 'draft', totalAmount: 100, currency: 'USD' },
    });
    render(
      <MemoryRouter initialEntries={['/requests/11/quotations/new']}>
        <AuthProvider role="agency">
          <Routes>
            <Route path="/requests/:id/quotations/new" element={<CreateQuotationPage />} />
            <Route path="/quotations/:id" element={<p>Quotation #5 (draft)</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await user.selectOptions(screen.getByLabelText('Quotation type'), 'hotel_only');
    await user.clear(screen.getByLabelText('Item 1 title'));
    await user.type(screen.getByLabelText('Item 1 title'), 'Hotel stay');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(agencyQuotationApi.createForRequest).toHaveBeenCalledOnce());
    const [requestId, payload] = agencyQuotationApi.createForRequest.mock.calls[0];
    expect(requestId).toBe('11');
    expect(payload).toMatchObject({ quotationType: 'hotel_only' });
    expect(payload).not.toHaveProperty('subtotal');
    expect(payload).not.toHaveProperty('totalAmount');
    await waitFor(() => expect(screen.getByText('Quotation #5 (draft)')).toBeInTheDocument());
  });
});

describe('quotation lifecycle', () => {
  test('submit moves a draft quotation to submitted', async () => {
    const user = userEvent.setup({ delay: null });
    authOk();
    agencyQuotationApi.getById.mockResolvedValue({
      quotation: { id: 5, quotationType: 'hotel_only', status: 'draft', items: [] },
    });
    agencyQuotationApi.submit.mockResolvedValue({
      quotation: { id: 5, quotationType: 'hotel_only', status: 'submitted', items: [] },
    });
    renderGuarded('/quotations/5');
    await waitFor(() => expect(screen.getByText(/Quotation #5/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Submit quotation' }));
    await waitFor(() => expect(agencyQuotationApi.submit).toHaveBeenCalledWith('5'));
    await waitFor(() => expect(screen.getByText(/\(submitted\)/)).toBeInTheDocument());
  });
});
