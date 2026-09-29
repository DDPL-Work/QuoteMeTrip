// Traveller Phase 5 frontend tests: quotation listing, detail, no acceptance UI.

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { TravelRequestDetailPage } from '../../../pages/travel-request-detail.jsx';
import { QuotationDetailPage } from '../../../pages/quotation-detail.jsx';
import { QuotationDetail } from '../../../components/QuotationDetail.jsx';

vi.mock('../../../lib/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => null),
  },
  authApi: { refresh: vi.fn(), me: vi.fn(), login: vi.fn(), logout: vi.fn() },
  setUnauthorizedListener: vi.fn(),
  travellerApi: { me: vi.fn(), updateMe: vi.fn() },
  routeApi: {
    calculate: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  travelRequestApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    cancel: vi.fn(),
    addDay: vi.fn(),
    updateDay: vi.fn(),
    deleteDay: vi.fn(),
    listQuotations: vi.fn(),
  },
  travellerQuotationApi: { getById: vi.fn() },
}));

import { authApi, travelRequestApi, travellerQuotationApi } from '../../../lib/api.js';

const travellerUser = { id: 1, email: 't@example.com', role: 'traveller', status: 'active' };

function authOk() {
  authApi.refresh.mockResolvedValue({ accessToken: 'a' });
  authApi.me.mockResolvedValue({ user: travellerUser });
}

const submittedRequest = { id: 7, status: 'submitted', days: [] };
const quotation = {
  id: 5,
  quotationType: 'hotel_only',
  status: 'submitted',
  currency: 'USD',
  totalAmount: 200,
  agency: { agencyName: 'Sun Travels', city: 'Colombo', country: 'LK' },
  items: [
    { id: 1, title: 'Hotel stay', itemType: 'hotel', quantity: 2, unitPrice: 100, lineTotal: 200 },
  ],
};

function renderDetail(path = '/travel-requests/7') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider role="traveller">
        <Routes>
          <Route
            path="/travel-requests/:id"
            element={
              <RequireAuth>
                <RequireRole roles={['traveller']}>
                  <TravelRequestDetailPage />
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

describe('traveller quotations', () => {
  test('submitted request lists quotations with agency snippet only', async () => {
    authOk();
    travelRequestApi.getById.mockResolvedValue({ request: submittedRequest });
    travelRequestApi.listQuotations.mockResolvedValue({ quotations: [quotation] });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Quotations')).toBeInTheDocument());
    expect(travelRequestApi.listQuotations).toHaveBeenCalledWith('7');
    expect(screen.getByText(/Sun Travels/)).toBeInTheDocument();
  });

  test('draft request shows no quotations section', async () => {
    authOk();
    travelRequestApi.getById.mockResolvedValue({ request: { id: 7, status: 'draft', days: [] } });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Status: draft')).toBeInTheDocument());
    expect(travelRequestApi.listQuotations).not.toHaveBeenCalled();
    expect(screen.queryByText('Quotations')).not.toBeInTheDocument();
  });

  test('quotation detail renders comparison table with no accept button', async () => {
    authOk();
    travelRequestApi.getById.mockResolvedValue({ request: submittedRequest });
    travelRequestApi.listQuotations.mockResolvedValue({ quotations: [quotation] });
    travellerQuotationApi.getById.mockResolvedValue({ quotation });
    const user = userEvent.setup({ delay: null });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Quotations')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'View quotation #5' }));
    await waitFor(() => expect(screen.getByText(/Hotel stay/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select/i })).not.toBeInTheDocument();
  });

  test('standalone quotation page loads without contact fields', async () => {
    authOk();
    travellerQuotationApi.getById.mockResolvedValue({ quotation });
    render(
      <MemoryRouter initialEntries={['/quotations/5']}>
        <AuthProvider role="traveller">
          <Routes>
            <Route
              path="/quotations/:id"
              element={
                <RequireAuth>
                  <RequireRole roles={['traveller']}>
                    <QuotationDetailPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Sun Travels/)).toBeInTheDocument());
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
  });

  test('QuotationDetail exposes no acceptance action', () => {
    render(
      <MemoryRouter>
        <QuotationDetail quotation={quotation} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });
});
