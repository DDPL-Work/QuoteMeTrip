// Traveller trip frontend tests (Phase 4).

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { TripProvider } from '../TripContext.jsx';
import { useTrip } from '../useTrip.js';
import { PlanTripPage } from '../../../pages/plan-trip.jsx';
import { TravelRequestsPage } from '../../../pages/travel-requests.jsx';
import { TravelRequestDetailPage } from '../../../pages/travel-request-detail.jsx';
import { TravelRequestForm } from '../../../components/TravelRequestForm.jsx';

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
  },
}));

import { authApi, routeApi, travelRequestApi } from '../../../lib/api.js';

const travellerUser = { id: 1, email: 't@example.com', role: 'traveller', status: 'active' };

function authOk() {
  authApi.refresh.mockResolvedValue({ accessToken: 'a' });
  authApi.me.mockResolvedValue({ user: travellerUser });
}

function Probes() {
  const trip = useTrip();
  return (
    <div>
      <span data-testid="count">{trip.stops.length}</span>
      <span data-testid="status">{trip.calculationStatus}</span>
      <span data-testid="order">{trip.stops.map((s) => s.name).join(',')}</span>
      <button
        type="button"
        onClick={() => trip.addStop({ name: 'A', latitude: 10, longitude: 20, type: 'start' })}
      >
        add-a
      </button>
      <button
        type="button"
        onClick={() => trip.addStop({ name: 'B', latitude: 11, longitude: 21, type: 'final' })}
      >
        add-b
      </button>
      <button type="button" onClick={() => trip.reorderStops(0, 1)}>
        swap
      </button>
      <button type="button" onClick={() => trip.calculateRoute()}>
        calc
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('protected traveller routes', () => {
  test('redirects to login when unauthenticated', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    render(
      <MemoryRouter initialEntries={['/plan-trip']}>
        <AuthProvider role="traveller">
          <Routes>
            <Route path="/login" element={<p>Login page</p>} />
            <Route
              path="/plan-trip"
              element={
                <RequireAuth>
                  <RequireRole roles={['traveller']}>
                    <PlanTripPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
  });
});

describe('trip context', () => {
  test('stop creation and ordering', async () => {
    const user = userEvent.setup();
    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );
    await user.click(screen.getByText('add-a'));
    await user.click(screen.getByText('add-b'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('order')).toHaveTextContent('A,B');
    await user.click(screen.getByText('swap'));
    expect(screen.getByTestId('order')).toHaveTextContent('B,A');
  });

  test('calculation state transitions', async () => {
    const user = userEvent.setup();
    routeApi.calculate.mockResolvedValue({ route: { distanceKm: 10 }, recommendedDays: 3 });
    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );
    await user.click(screen.getByText('add-a'));
    await user.click(screen.getByText('add-b'));
    await user.click(screen.getByText('calc'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('calculated'));
  });
});

describe('request form validation', () => {
  test('blocks invalid dates', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <TripProvider>
          <TravelRequestForm onSubmit={onSubmit} />
        </TripProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByText('Save request'));
    onSubmit.mockClear();
    // empty dates are allowed by UX validation (backend optional); force bad range
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '2026-05-10');
    await user.type(inputs[1], '2026-05-01');
    await user.click(screen.getByText('Save request'));
    expect(
      await screen.findByText('End date cannot be before the start date.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('travel requests', () => {
  test('draft loading renders summary', async () => {
    authOk();
    travelRequestApi.getById.mockResolvedValue({ request: { id: 7, status: 'draft', days: [] } });
    render(
      <MemoryRouter initialEntries={['/travel-requests/7']}>
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
    await waitFor(() => expect(screen.getByText('Status: draft')).toBeInTheDocument());
  });

  test('submit workflow calls submit API', async () => {
    const user = userEvent.setup();
    authOk();
    travelRequestApi.getById.mockResolvedValue({ request: { id: 7, status: 'draft', days: [] } });
    travelRequestApi.submit.mockResolvedValue({
      request: { id: 7, status: 'submitted', days: [] },
    });
    render(
      <MemoryRouter initialEntries={['/travel-requests/7']}>
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
    await waitFor(() => expect(screen.getByText('Status: draft')).toBeInTheDocument());
    await user.click(screen.getByText('Submit request'));
    await waitFor(() => expect(travelRequestApi.submit).toHaveBeenCalledWith('7'));
    await waitFor(() => expect(screen.getByText('Status: submitted')).toBeInTheDocument());
  });

  test('list page links to detail', async () => {
    travelRequestApi.list.mockResolvedValue({ requests: [{ id: 3, status: 'draft' }] });
    render(
      <MemoryRouter>
        <TravelRequestsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Request #3 (draft)')).toBeInTheDocument());
  });
});
