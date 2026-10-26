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
import { I18nProvider } from '@troublefree/i18n';
import { RouteOverviewSummary } from '../../../components/RouteOverviewSummary.jsx';
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
      <span data-testid="mode">{trip.travelMode}</span>
      <span data-testid="stale">{String(trip.isStale)}</span>
      <span data-testid="distance">{trip.currentRoute?.distanceKm ?? 'none'}</span>
      <span data-testid="duration">{trip.currentRoute?.durationMinutes ?? 'none'}</span>
      <span data-testid="polyline">{trip.currentRoute?.encodedPolyline ?? 'none'}</span>
      <span data-testid="error">{trip.apiError || 'none'}</span>
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
      <button
        type="button"
        onClick={() => trip.addStop({ name: 'Delhi', latitude: 28.6139, longitude: 77.209, type: 'start' })}
      >
        add-delhi
      </button>
      <button
        type="button"
        onClick={() => trip.addStop({ name: 'Dehradun', latitude: 30.3165, longitude: 78.0322, type: 'final' })}
      >
        add-dehradun
      </button>
      <button type="button" onClick={() => trip.reorderStops(0, 1)}>
        swap
      </button>
      <button type="button" onClick={() => trip.setTravelMode('DRIVE')}>
        mode-drive
      </button>
      <button type="button" onClick={() => trip.setTravelMode('AIR')}>
        mode-air
      </button>
      <button type="button" onClick={() => trip.setTravelMode('WALK')}>
        mode-walk
      </button>
      <button type="button" onClick={() => trip.setTravelMode('BICYCLE')}>
        mode-bike
      </button>
      <button type="button" onClick={() => trip.calculateRoute().catch(() => {})}>
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
    routeApi.calculate.mockResolvedValue({
      route: { distanceKm: 10, durationMinutes: 15, encodedPolyline: 'test_poly' },
      recommendedDays: 3,
    });
    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );
    await user.click(screen.getByText('add-a'));
    await user.click(screen.getByText('add-b'));
    await user.click(screen.getByText('calc'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('calculated'));
    expect(screen.getByTestId('distance')).toHaveTextContent('10');
    expect(screen.getByTestId('duration')).toHaveTextContent('15');
    expect(screen.getByTestId('polyline')).toHaveTextContent('test_poly');
    expect(screen.getByTestId('stale')).toHaveTextContent('false');
  });

  test('travelMode switching updates mode, marks route stale, and sends mode to calculate API', async () => {
    const user = userEvent.setup();
    routeApi.calculate.mockResolvedValue({
      route: { distanceKm: 233, durationMinutes: null, travelMode: 'AIR', isAir: true, encodedPolyline: 'air_poly' },
      recommendedDays: 2,
    });

    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );
    await user.click(screen.getByText('add-a'));
    await user.click(screen.getByText('add-b'));
    expect(screen.getByTestId('mode')).toHaveTextContent('DRIVE');

    // Change to AIR
    await user.click(screen.getByText('mode-air'));
    expect(screen.getByTestId('mode')).toHaveTextContent('AIR');
    expect(screen.getByTestId('stale')).toHaveTextContent('true');

    // Calculate in AIR mode
    await user.click(screen.getByText('calc'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('calculated'));

    expect(routeApi.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        travelMode: 'AIR',
        stops: expect.arrayContaining([
          expect.objectContaining({ name: 'A' }),
          expect.objectContaining({ name: 'B' }),
        ]),
      }),
    );
    expect(screen.getByTestId('distance')).toHaveTextContent('233');
    expect(screen.getByTestId('duration')).toHaveTextContent('none'); // Air mode has null duration
    expect(screen.getByTestId('polyline')).toHaveTextContent('air_poly');
    expect(screen.getByTestId('stale')).toHaveTextContent('false');
  });

  test('route-calculation error preserves selected stops for retry', async () => {
    const user = userEvent.setup();
    routeApi.calculate.mockRejectedValue(new Error('Invalid route parameters provided for Google Routes API.'));

    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );
    await user.click(screen.getByText('add-a'));
    await user.click(screen.getByText('add-b'));
    await user.click(screen.getByText('calc'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('count')).toHaveTextContent('2'); // Stops preserved
    expect(screen.getByTestId('error')).toHaveTextContent('Invalid route parameters provided for Google Routes API.');
  });

  test('switching from DRIVE to WALK automatically recalculates when route exists', async () => {
    const user = userEvent.setup();
    routeApi.calculate
      .mockResolvedValueOnce({
        route: { distanceKm: 216.12, durationMinutes: 190, travelMode: 'DRIVE', encodedPolyline: 'drive_poly' },
        recommendedDays: 1,
      })
      .mockResolvedValueOnce({
        route: { distanceKm: 216.12, durationMinutes: 2590, travelMode: 'WALK', encodedPolyline: 'walk_poly' },
        recommendedDays: 8,
      });

    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );

    await user.click(screen.getByText('add-delhi'));
    await user.click(screen.getByText('add-dehradun'));

    // 1. Initial DRIVE calculation
    await user.click(screen.getByText('calc'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('calculated'));
    expect(screen.getByTestId('mode')).toHaveTextContent('DRIVE');
    expect(screen.getByTestId('distance')).toHaveTextContent('216.12');
    expect(screen.getByTestId('duration')).toHaveTextContent('190');
    expect(screen.getByTestId('polyline')).toHaveTextContent('drive_poly');

    // 2. Switch to WALK mode: triggers automatic recalculation
    await user.click(screen.getByText('mode-walk'));
    expect(screen.getByTestId('mode')).toHaveTextContent('WALK');

    // Automatically recalculates with travelMode: WALK
    await waitFor(() => {
      expect(routeApi.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          travelMode: 'WALK',
        }),
      );
    });

    // Walking metrics replace driving metrics
    await waitFor(() => expect(screen.getByTestId('duration')).toHaveTextContent('2590'));
    expect(screen.getByTestId('distance')).toHaveTextContent('216.12');
    expect(screen.getByTestId('polyline')).toHaveTextContent('walk_poly');
    expect(screen.getByTestId('stale')).toHaveTextContent('false');
  });

  test('out-of-order async responses cannot overwrite a newer travel mode selection', async () => {
    const user = userEvent.setup();

    let resolveSlowWalk;
    let resolveFastBike;

    routeApi.calculate
      .mockResolvedValueOnce({
        route: { distanceKm: 216.12, durationMinutes: 190, travelMode: 'DRIVE' },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSlowWalk = () =>
              resolve({
                route: { distanceKm: 216.12, durationMinutes: 2590, travelMode: 'WALK', encodedPolyline: 'slow_walk' },
              });
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFastBike = () =>
              resolve({
                route: { distanceKm: 216.12, durationMinutes: 860, travelMode: 'BICYCLE', encodedPolyline: 'fast_bike' },
              });
          }),
      );

    render(
      <TripProvider>
        <Probes />
      </TripProvider>,
    );

    await user.click(screen.getByText('add-delhi'));
    await user.click(screen.getByText('add-dehradun'));
    await user.click(screen.getByText('calc'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('calculated'));

    // Trigger walk (slow)
    await user.click(screen.getByText('mode-walk'));

    // Trigger bicycle (fast) before walk completes
    await user.click(screen.getByText('mode-bike'));

    // Bicycle resolves first
    resolveFastBike();
    await waitFor(() => expect(screen.getByTestId('polyline')).toHaveTextContent('fast_bike'));
    expect(screen.getByTestId('duration')).toHaveTextContent('860');

    // Walk resolves later: MUST be discarded and not overwrite bicycle result
    resolveSlowWalk();
    // Duration and polyline should STILL be bicycle!
    expect(screen.getByTestId('polyline')).toHaveTextContent('fast_bike');
    expect(screen.getByTestId('duration')).toHaveTextContent('860');
  });
});

describe('RouteOverviewSummary Delhi–Dehradun scenario and mode synchronization', () => {
  const delhi = { name: 'Delhi', latitude: 28.6139, longitude: 77.209 };
  const dehradun = { name: 'Dehradun', latitude: 30.3165, longitude: 78.0322 };
  const stops = [delhi, dehradun];

  test('Drive route displays Road Journey Summary, Road Distance, and DRIVE Route Calculated', () => {
    const driveRoute = {
      travelMode: 'DRIVE',
      distanceKm: 216.12,
      durationMinutes: 190,
      legs: [{ distanceKm: 216.12, durationMinutes: 190 }],
    };

    render(
      <I18nProvider initialLocale="en">
        <RouteOverviewSummary route={driveRoute} stops={stops} travelMode="DRIVE" />
      </I18nProvider>,
    );

    expect(screen.getByText(/Road Journey Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Road Distance/i)).toBeInTheDocument();
    expect(screen.getByText('216.12 km')).toBeInTheDocument();
    expect(screen.getByText(/Driving Time/i)).toBeInTheDocument();
    expect(screen.getByText('3 hrs 10 mins')).toBeInTheDocument();
    expect(screen.getByText('DRIVE Route Calculated')).toBeInTheDocument();
  });

  test('Walk route displays Walking Journey Summary, Walking Distance, Walking Time, and WALK Route Calculated', () => {
    const walkRoute = {
      travelMode: 'WALK',
      distanceKm: 216.12,
      durationMinutes: 2590, // 43 hrs 10 mins
      legs: [{ distanceKm: 216.12, durationMinutes: 2590 }],
    };

    render(
      <I18nProvider initialLocale="en">
        <RouteOverviewSummary route={walkRoute} stops={stops} travelMode="WALK" />
      </I18nProvider>,
    );

    expect(screen.getByText(/Walking Journey Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Walking Distance/i)).toBeInTheDocument();
    expect(screen.getByText('216.12 km')).toBeInTheDocument();
    expect(screen.getByText(/Walking Time/i)).toBeInTheDocument();
    expect(screen.getByText('43 hrs 10 mins')).toBeInTheDocument();
    expect(screen.getByText('WALK Route Calculated')).toBeInTheDocument();
    expect(screen.queryByText(/Driving Time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DRIVE Route Calculated/i)).not.toBeInTheDocument();
  });

  test('Mode mismatch does not display driving metrics under walking label', () => {
    const driveRoute = {
      travelMode: 'DRIVE',
      distanceKm: 216.12,
      durationMinutes: 190,
    };

    // User selected WALK, but route in state is still DRIVE
    render(
      <I18nProvider initialLocale="en">
        <RouteOverviewSummary route={driveRoute} stops={stops} travelMode="WALK" isCalculating={true} />
      </I18nProvider>,
    );

    expect(screen.getByText(/Walking Journey Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Walking Distance/i)).toBeInTheDocument();
    expect(screen.getByText(/Walking Time/i)).toBeInTheDocument();
    // Must NOT display 190 mins / 3 hrs 10 mins!
    expect(screen.queryByText('3 hrs 10 mins')).not.toBeInTheDocument();
    expect(screen.queryByText('DRIVE Route Calculated')).not.toBeInTheDocument();
  });

  test('Turkish localization displays translated walking labels', () => {
    const walkRoute = {
      travelMode: 'WALK',
      distanceKm: 216.12,
      durationMinutes: 2590,
    };

    render(
      <I18nProvider initialLocale="tr">
        <RouteOverviewSummary route={walkRoute} stops={stops} travelMode="WALK" />
      </I18nProvider>,
    );

    expect(screen.getByText(/Yürüyüş Seyahat Özeti/i)).toBeInTheDocument();
    expect(screen.getByText(/Yürüme Mesafesi/i)).toBeInTheDocument();
    expect(screen.getByText(/Yürüme Süresi/i)).toBeInTheDocument();
    expect(screen.getByText('43 sa 10 dk')).toBeInTheDocument();
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
    await user.clear(inputs[1]);
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
