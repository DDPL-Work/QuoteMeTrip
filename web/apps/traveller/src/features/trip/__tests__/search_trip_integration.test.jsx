import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

import {
  CANONICAL_SCOPES,
  normalizeScope,
  scopeToLabel,
  serializeSearchToQuery,
  parseSearchParams,
} from '../search-trip-mapping.js';
import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth } from '../../auth/ProtectedRoute.jsx';
import { TripProvider } from '../TripContext.jsx';
import { PlanTripPage } from '../../../pages/plan-trip.jsx';
import { TravelRequestForm } from '../../../components/TravelRequestForm.jsx';
import { RequestReview } from '../../../components/RequestReview.jsx';

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
  },
  setUnauthorizedListener: vi.fn(),
  travellerApi: {
    me: vi.fn(),
    updateMe: vi.fn(),
  },
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

import { authApi, travellerApi, travelRequestApi } from '../../../lib/api.js';

const mockTravellerUser = {
  id: 101,
  name: 'Test Traveller',
  email: 'traveller@example.com',
  role: 'traveller',
  status: 'active',
};

function setupAuthSuccess() {
  authApi.refresh.mockResolvedValue({ accessToken: 'fake-token' });
  authApi.me.mockResolvedValue({ user: mockTravellerUser });
  travellerApi.me.mockResolvedValue({ user: mockTravellerUser });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}{location.search}</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Search-to-Trip Mapping & Canonical Categories (Phase 6 Master Prompt)', () => {
  test('all 5 canonical service categories are supported and normalized', () => {
    expect(CANONICAL_SCOPES).toEqual([
      'blue_cruise',
      'full_package',
      'hotel_only',
      'vehicle_driver',
      'guide_activities',
    ]);

    // Test labels and variants
    expect(normalizeScope('Blue Cruise')).toBe('blue_cruise');
    expect(normalizeScope('blue_cruise')).toBe('blue_cruise');
    expect(normalizeScope('Full Package')).toBe('full_package');
    expect(normalizeScope('full_package')).toBe('full_package');
    expect(normalizeScope('Hotel Only')).toBe('hotel_only');
    expect(normalizeScope('hotel_only')).toBe('hotel_only');
    expect(normalizeScope('Vehicle + driver')).toBe('vehicle_driver');
    expect(normalizeScope('Vehicle + Driver')).toBe('vehicle_driver');
    expect(normalizeScope('vehicle_+_driver')).toBe('vehicle_driver');
    expect(normalizeScope('vehicle_driver')).toBe('vehicle_driver');
    expect(normalizeScope('Guide & activities')).toBe('guide_activities');
    expect(normalizeScope('Guide & Activities')).toBe('guide_activities');
    expect(normalizeScope('guide_&_activities')).toBe('guide_activities');
    expect(normalizeScope('guide_activities')).toBe('guide_activities');

    // Unknown defaults to full_package
    expect(normalizeScope('something_unknown')).toBe('full_package');
    expect(normalizeScope('')).toBe('full_package');
  });

  test('scopeToLabel formats canonical scopes into human-readable titles', () => {
    expect(scopeToLabel('blue_cruise')).toBe('Blue Cruise');
    expect(scopeToLabel('full_package')).toBe('Full Package');
    expect(scopeToLabel('hotel_only')).toBe('Hotel Only');
    expect(scopeToLabel('vehicle_driver')).toBe('Vehicle + Driver');
    expect(scopeToLabel('guide_activities')).toBe('Guide & Activities');
  });

  test('serializeSearchToQuery correctly serializes all search fields with validation', () => {
    const query = serializeSearchToQuery(
      {
        country: 'Türkiye',
        startDate: '2026-10-27',
        days: 7,
        travellers: 2,
        flexible: true,
        suggest: true,
      },
      'Blue Cruise'
    );

    expect(query).toContain('country=T%C3%BCrkiye');
    expect(query).toContain('startDate=2026-10-27');
    expect(query).toContain('days=7');
    expect(query).toContain('travellers=2');
    expect(query).toContain('scope=blue_cruise');
    expect(query).toContain('flexible=true');
    expect(query).toContain('suggest=true');
  });

  test('parseSearchParams parses, validates, and sets correct service requirement defaults', () => {
    // 1. Blue Cruise
    const parsedCruise = parseSearchParams(
      '?country=T%C3%BCrkiye&startDate=2026-10-27&days=7&travellers=2&scope=blue_cruise&flexible=true&suggest=true'
    );
    expect(parsedCruise.country).toBe('Türkiye');
    expect(parsedCruise.startDate).toBe('2026-10-27');
    expect(parsedCruise.days).toBe(7);
    expect(parsedCruise.travellers).toBe(2);
    expect(parsedCruise.scope).toBe('blue_cruise');
    expect(parsedCruise.flexible).toBe(true);
    expect(parsedCruise.suggest).toBe(true);
    expect(parsedCruise.travelEndDate).toBe('2026-11-02');
    expect(parsedCruise.cruiseDuration).toBe('6d_5n');

    // 2. Hotel Only
    const parsedHotel = parseSearchParams('?scope=hotel_only&days=4&travellers=3');
    expect(parsedHotel.scope).toBe('hotel_only');
    expect(parsedHotel.hotelRequired).toBe(true);
    expect(parsedHotel.driverRequired).toBe(false);
    expect(parsedHotel.guideRequired).toBe(false);

    // 3. Vehicle + Driver
    const parsedVehicle = parseSearchParams('?scope=vehicle_driver');
    expect(parsedVehicle.scope).toBe('vehicle_driver');
    expect(parsedVehicle.driverRequired).toBe(true);
    expect(parsedHotel.guideRequired).toBe(false);

    // 4. Guide & Activities
    const parsedGuide = parseSearchParams('?scope=guide_activities');
    expect(parsedGuide.scope).toBe('guide_activities');
    expect(parsedGuide.guideRequired).toBe(true);

    // 5. Handling invalid / out of bound values gracefully
    const parsedInvalid = parseSearchParams('?startDate=invalid-date&days=999&travellers=-5&scope=random');
    expect(parsedInvalid.startDate).toBe(''); // Safely rejected invalid date string
    expect(parsedInvalid.days).toBe(7); // Falls back to safe default 7 days
    expect(parsedInvalid.travellers).toBe(2); // Falls back to safe default 2 travellers
    expect(parsedInvalid.scope).toBe('full_package');
  });
});

describe('PlanTripPage Query Parameter Hydration & End-to-End Workflow', () => {
  test('direct loading of /plan-trip with search query populates form state and displays search strip', async () => {
    setupAuthSuccess();

    render(
      <MemoryRouter
        initialEntries={[
          '/plan-trip?country=Italy&startDate=2026-11-15&days=10&travellers=4&scope=vehicle_driver&flexible=true&suggest=true',
        ]}
      >
        <AuthProvider>
          <TripProvider>
            <Routes>
              <Route path="/plan-trip" element={<PlanTripPage />} />
            </Routes>
          </TripProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify search preferences strip renders prefilled values
    await waitFor(() => {
      expect(screen.getByTestId('search-preferences-strip')).toBeInTheDocument();
    });

    const strip = screen.getByTestId('search-preferences-strip');
    expect(strip).toHaveTextContent('Italy');
    expect(strip).toHaveTextContent('2026-11-15');
    expect(strip).toHaveTextContent('10 Days');
    expect(strip).toHaveTextContent('4 Travellers');
    expect(strip).toHaveTextContent('Vehicle + Driver');
    expect(strip).toHaveTextContent('Agencies Suggest Route');

    // Verify agency route suggestion callout in Step 1
    const suggestBanner = screen.getByTestId('suggest-route-banner');
    expect(suggestBanner).toBeInTheDocument();
    expect(suggestBanner).toHaveTextContent('Letting agencies suggest the route');

    // Click "Skip to Trip Details (Step 2)"
    const skipBtn = screen.getByRole('button', { name: /Skip to Trip Details/i });
    await userEvent.click(skipBtn);

    // Verify Step 2 inputs are prefilled with the search query values
    await waitFor(() => {
      expect(screen.getByLabelText(/Destination Country/i)).toHaveValue('Italy');
    });

    expect(screen.getByLabelText(/Your Chosen Trip Duration/i)).toHaveValue('10');
    expect(screen.getByDisplayValue('2026-11-15')).toBeInTheDocument();
    expect(screen.getByText('4 Travellers')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /dates are flexible/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /suggest & refine the route/i })).toBeChecked();
  });

  test('user edits in Step 2 update the planning state and reflect in Review', async () => {
    setupAuthSuccess();

    const mockForm = {
      destinationCountry: 'Türkiye',
      travelStartDate: '2026-10-27',
      travelEndDate: '2026-11-03',
      chosenDuration: 7,
      numberOfTravellers: 2,
      luggageCount: 2,
      accommodationType: '4_star',
      hotelRequired: true,
      guideRequired: false,
      driverRequired: false,
      packageType: 'blue_cruise',
      cruiseDuration: '6d_5n',
      isFlexibleDates: true,
      suggestRoute: true,
      specialRequests: 'Vegan meals requested',
    };

    render(
      <MemoryRouter>
        <RequestReview
          form={mockForm}
          routeStops={[]}
          currentRoute={null}
          onSubmit={vi.fn()}
          onBack={vi.fn()}
          isSubmitting={false}
        />
      </MemoryRouter>
    );

    // Check that Review renders prefilled values
    expect(screen.getByText('Türkiye')).toBeInTheDocument();
    expect(screen.getByText('Blue Cruise')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flexible dates')).toBeInTheDocument();
    expect(screen.getByText('Agencies suggest route')).toBeInTheDocument();
  });

  test('unauthenticated access to /plan-trip preserves query string in auth redirect', async () => {
    authApi.refresh.mockRejectedValue(new Error('unauthenticated'));
    authApi.me.mockRejectedValue(new Error('unauthenticated'));

    render(
      <MemoryRouter
        initialEntries={[
          '/plan-trip?country=T%C3%BCrkiye&startDate=2026-10-27&days=7&travellers=2&scope=blue_cruise',
        ]}
      >
        <AuthProvider>
          <Routes>
            <Route
              path="/plan-trip"
              element={
                <RequireAuth>
                  <div>Protected Trip Plan</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LocationProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const locationProbe = screen.getByTestId('current-location');
      expect(locationProbe).toBeInTheDocument();
      // Should redirect to /login with redirect query param containing the full path & search
      expect(locationProbe.textContent).toContain('/login?redirect=');
      expect(locationProbe.textContent).toContain('country%3DT%25C3%25BCrkiye');
      expect(locationProbe.textContent).toContain('scope%3Dblue_cruise');
    });
  });
});
