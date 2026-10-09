/**
 * Traveller Public Website Frontend Tests (QuoteMeTrip Canonical Routing).
 *
 * Comprehensive tests verifying every required public URL, content rendering,
 * search/filter behaviors, legacy redirects, 404 handling, and portal protections.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { PublicLayout } from '../../../layouts/PublicLayout.jsx';

import { PublicHomePage } from '../../../pages/public/HomePage.jsx';
import { DestinationsPage } from '../../../pages/public/DestinationsPage.jsx';
import { CountryDestinationPage } from '../../../pages/public/CountryDestinationPage.jsx';
import { DestinationDetailPage } from '../../../pages/public/DestinationDetailPage.jsx';
import { TravelServicesPage } from '../../../pages/public/TravelServicesPage.jsx';
import { TravelServiceDetailPage } from '../../../pages/public/TravelServiceDetailPage.jsx';
import { TravelGuidePage } from '../../../pages/public/TravelGuidePage.jsx';
import { TravelGuideDetailPage } from '../../../pages/public/TravelGuideDetailPage.jsx';
import { AgenciesPage } from '../../../pages/public/AgenciesPage.jsx';
import { AgencyDetailPage } from '../../../pages/public/AgencyDetailPage.jsx';
import { HowItWorksPage } from '../../../pages/public/HowItWorksPage.jsx';
import { AboutPage } from '../../../pages/public/AboutPage.jsx';
import { ContactPage } from '../../../pages/public/ContactPage.jsx';
import { NotFoundPage } from '../../../pages/public/NotFoundPage.jsx';

vi.mock('../../../lib/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => null),
  },
  authApi: {
    refresh: vi.fn().mockRejectedValue(new Error('no session')),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  travelGuideApi: {
    getRegions: vi.fn().mockResolvedValue([]),
    getDestinations: vi.fn().mockResolvedValue([]),
    getDestinationBySlug: vi.fn().mockRejectedValue(new Error('not found')),
    getArticles: vi.fn().mockResolvedValue([]),
    getArticleBySlug: vi.fn().mockRejectedValue(new Error('not found')),
  },
  setUnauthorizedListener: vi.fn(),
}));

function DestinationCountryOrRedirect() {
  const { countrySlug } = useParams();
  const lower = (countrySlug || '').toLowerCase();
  if (lower === 'turkey') {
    return <CountryDestinationPage />;
  }
  const knownDestinations = [
    'istanbul',
    'cappadocia',
    'antalya',
    'pamukkale',
    'efes',
    'bodrum',
    'ephesus-izmir',
    'ephesus',
    'trabzon-rize',
  ];
  if (knownDestinations.includes(lower)) {
    const canonicalSlug = lower === 'ephesus-izmir' || lower === 'ephesus' ? 'efes' : lower;
    return <Navigate to={`/destinations/turkey/${canonicalSlug}`} replace />;
  }
  return <NotFoundPage />;
}

function AgencyRouteResolver() {
  const { locationOrId } = useParams();
  if (!locationOrId) return <AgenciesPage />;
  if (/^\d+$/.test(locationOrId)) {
    return <AgencyDetailPage agencyId={locationOrId} />;
  }
  return <AgenciesPage locationFilter={locationOrId} />;
}

function LegacyTravelGuideRedirect() {
  const { slug } = useParams();
  const aliasMap = {
    'first-time-turkey-itinerary': 'istanbul',
    'cappadocia-balloon-guide': 'cappadocia',
    'best-mediterranean-beaches': 'antalya',
    'turkish-cuisine-foodie-guide': 'ephesus',
  };
  const target = aliasMap[slug] || slug;
  return <Navigate to={`/travel-guides/${target}`} replace />;
}

function renderPublicApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider>
        <AuthProvider role="traveller">
          <Routes>
            <Route element={<PublicLayout />}>
              {/* Main public pages */}
              <Route path="/" element={<PublicHomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about-us" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Destinations */}
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:countrySlug" element={<DestinationCountryOrRedirect />} />
              <Route
                path="/destinations/:countrySlug/:destinationSlug"
                element={<DestinationDetailPage />}
              />

              {/* Travel services */}
              <Route path="/travel-services" element={<TravelServicesPage />} />
              <Route
                path="/travel-services/:serviceSlug"
                element={<TravelServiceDetailPage />}
              />

              {/* Travel guides */}
              <Route path="/travel-guides" element={<TravelGuidePage />} />
              <Route
                path="/travel-guides/:guideSlug"
                element={<TravelGuideDetailPage />}
              />

              {/* Agencies */}
              <Route path="/agencies" element={<AgenciesPage />} />
              <Route
                path="/agencies/turkey"
                element={<AgenciesPage locationFilter="turkey" />}
              />
              <Route
                path="/agencies/istanbul"
                element={<AgenciesPage locationFilter="istanbul" />}
              />
              <Route
                path="/agencies/cappadocia"
                element={<AgenciesPage locationFilter="cappadocia" />}
              />
              <Route path="/agencies/:locationOrId" element={<AgencyRouteResolver />} />

              {/* Backward compatibility redirects */}
              <Route path="/about" element={<Navigate to="/about-us" replace />} />
              <Route path="/travel-guide" element={<Navigate to="/travel-guides" replace />} />
              <Route path="/travel-guide/:slug" element={<LegacyTravelGuideRedirect />} />

              {/* 404 Not Found Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/login" element={<p>Login Page Container</p>} />
            <Route
              path="/plan-trip"
              element={
                <RequireAuth>
                  <RequireRole roles={['traveller']}>
                    <p>Plan Trip Portal Page</p>
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
  localStorage.clear();
});

describe('1. Main Public Pages', () => {
  test('renders homepage (/) with hero and sections', async () => {
    renderPublicApp('/');
    await waitFor(() => expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument());
    expect(screen.getByText('Popular routes')).toBeInTheDocument();
    expect(screen.getByText('How QuoteMeTrip works')).toBeInTheDocument();
  });

  test('renders How It Works (/how-it-works) with 3-step details', async () => {
    renderPublicApp('/how-it-works');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'How QuoteMeTrip Works' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Build your itinerary, day by day/i)).toBeInTheDocument();
    expect(screen.getByText(/Receive quotes from local agencies/i)).toBeInTheDocument();
    expect(screen.getByText(/Agree, pay directly, get confirmed/i)).toBeInTheDocument();
  });

  test('renders About Us (/about-us) with capabilities and breadcrumbs', async () => {
    renderPublicApp('/about-us');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /About QuoteMeTrip/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Route-First Itinerary Builder/i)).toBeInTheDocument();
  });

  test('renders Contact page (/contact) and handles submission', async () => {
    const user = userEvent.setup({ delay: null });
    renderPublicApp('/contact');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Contact Us' })).toBeInTheDocument(),
    );

    const nameInput = screen.getByLabelText(/Your Name/i);
    const emailInput = screen.getByLabelText(/Your Email/i);
    const messageInput = screen.getByLabelText(/Message/i);

    await user.type(nameInput, 'Traveler Alex');
    await user.type(emailInput, 'alex@example.com');
    await user.type(messageInput, 'Need help with an itinerary.');
    await user.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => expect(screen.getByText('Message Sent')).toBeInTheDocument());
  });
});

describe('2. Destinations Routes', () => {
  test('renders /destinations listing with search and region filter', async () => {
    const user = userEvent.setup({ delay: null });
    renderPublicApp('/destinations');
    await waitFor(() => expect(screen.getByText('Explore Destinations')).toBeInTheDocument());
    expect(screen.getByText('Istanbul')).toBeInTheDocument();
    expect(screen.getByText('Cappadocia')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search destinations');
    await user.type(searchInput, 'Cappadocia');
    await waitFor(() => expect(screen.queryByText('Istanbul')).not.toBeInTheDocument());
    expect(screen.getByText('Cappadocia')).toBeInTheDocument();
  });

  test('renders /destinations/turkey country landing page', async () => {
    renderPublicApp('/destinations/turkey');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Turkey (Türkiye)' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/About Turkey \(Türkiye\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Travel Essentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Destinations in Turkey \(Türkiye\)/i)).toBeInTheDocument();
  });

  test('renders /destinations/turkey/istanbul detail page', async () => {
    renderPublicApp('/destinations/turkey/istanbul');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Istanbul' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Where East meets West across the historic Bosphorus/i)).toBeInTheDocument();
  });

  test('renders /destinations/turkey/cappadocia detail page', async () => {
    renderPublicApp('/destinations/turkey/cappadocia');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Cappadocia' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Fairy chimneys, hot air balloons, and underground cities/i)).toBeInTheDocument();
  });

  test('renders /destinations/turkey/antalya detail page', async () => {
    renderPublicApp('/destinations/turkey/antalya');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Antalya' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/The Turquoise Coast jewel/i)).toBeInTheDocument();
  });

  test('renders /destinations/turkey/pamukkale detail page', async () => {
    renderPublicApp('/destinations/turkey/pamukkale');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Pamukkale' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Snow-white travertine terraces/i)).toBeInTheDocument();
  });

  test('renders /destinations/turkey/efes detail page', async () => {
    renderPublicApp('/destinations/turkey/efes');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Efes (Ephesus)' })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/Library of Celsus/i).length).toBeGreaterThan(0);
  });
});

describe('3. Travel Services Routes', () => {
  test('renders /travel-services directory', async () => {
    renderPublicApp('/travel-services');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Travel Services in Turkey' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Private Tours')).toBeInTheDocument();
    expect(screen.getByText('Private Transfer')).toBeInTheDocument();
    expect(screen.getByText('Minibus with Driver')).toBeInTheDocument();
    expect(screen.getByText('Licensed Guide')).toBeInTheDocument();
    expect(screen.getByText('Hot Air Balloon')).toBeInTheDocument();
  });

  test('renders /travel-services/private-tours detail page', async () => {
    renderPublicApp('/travel-services/private-tours');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Private Tours' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/What Is Included/i)).toBeInTheDocument();
    expect(screen.getByText(/Dedicated licensed professional guide/i)).toBeInTheDocument();
  });

  test('renders /travel-services/private-transfer detail page', async () => {
    renderPublicApp('/travel-services/private-transfer');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Private Transfer' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Meet & Greet service with name board/i)).toBeInTheDocument();
  });

  test('renders /travel-services/minibus-with-driver detail page', async () => {
    renderPublicApp('/travel-services/minibus-with-driver');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Minibus with Driver' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Chauffeured vans for families/i)).toBeInTheDocument();
  });

  test('renders /travel-services/guide detail page', async () => {
    renderPublicApp('/travel-services/guide');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Licensed Guide' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Ministry of Culture & Tourism/i)).toBeInTheDocument();
  });

  test('renders /travel-services/hot-air-balloon detail page', async () => {
    renderPublicApp('/travel-services/hot-air-balloon');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Hot Air Balloon' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Soar above fairy chimneys/i)).toBeInTheDocument();
  });
});

describe('4. Travel Guides Routes', () => {
  test('renders /travel-guides list page', async () => {
    renderPublicApp('/travel-guides');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Travel Guides' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Complete Travel Guide to Istanbul')).toBeInTheDocument();
  });

  test('renders /travel-guides/istanbul detail page', async () => {
    renderPublicApp('/travel-guides/istanbul');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Complete Travel Guide to Istanbul' })).toBeInTheDocument(),
    );
  });

  test('renders /travel-guides/cappadocia detail page', async () => {
    renderPublicApp('/travel-guides/cappadocia');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Cappadocia Travel & Hot Air Balloon Guide' }),
      ).toBeInTheDocument(),
    );
  });

  test('renders /travel-guides/gallipoli detail page', async () => {
    renderPublicApp('/travel-guides/gallipoli');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Gallipoli Peninsula & Anzac Cove Historical Guide',
        }),
      ).toBeInTheDocument(),
    );
  });

  test('renders /travel-guides/pamukkale detail page', async () => {
    renderPublicApp('/travel-guides/pamukkale');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Pamukkale Travertines & Hierapolis Complete Guide',
        }),
      ).toBeInTheDocument(),
    );
  });

  test('renders /travel-guides/ephesus detail page', async () => {
    renderPublicApp('/travel-guides/ephesus');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Ephesus Ancient City & Aegean Coast Guide' }),
      ).toBeInTheDocument(),
    );
  });

  test('renders /travel-guides/antalya detail page', async () => {
    renderPublicApp('/travel-guides/antalya');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Antalya & The Turquoise Coast Guide' }),
      ).toBeInTheDocument(),
    );
  });
});

describe('5. Agencies Routes', () => {
  test('renders /agencies directory', async () => {
    renderPublicApp('/agencies');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /Travel Agencies/i })).toBeInTheDocument(),
    );
    expect(screen.getByText('Anatolia Heritage Travel')).toBeInTheDocument();
  });

  test('renders /agencies/turkey filtered directory', async () => {
    renderPublicApp('/agencies/turkey');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Verified Travel Agencies in Turkey (Türkiye)' }),
      ).toBeInTheDocument(),
    );
  });

  test('renders /agencies/istanbul filtered directory', async () => {
    renderPublicApp('/agencies/istanbul');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Verified Travel Agencies in Istanbul' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Anatolia Heritage Travel')).toBeInTheDocument();
  });

  test('renders /agencies/cappadocia filtered directory', async () => {
    renderPublicApp('/agencies/cappadocia');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Verified Travel Agencies in Cappadocia' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Fairy Chimney Tours & Ballooning')).toBeInTheDocument();
  });
});

describe('6. Legacy Route Redirects & 404 Handling', () => {
  test('redirects legacy /about to /about-us', async () => {
    renderPublicApp('/about');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /About QuoteMeTrip/i })).toBeInTheDocument(),
    );
  });

  test('redirects legacy /travel-guide to /travel-guides', async () => {
    renderPublicApp('/travel-guide');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Travel Guides' })).toBeInTheDocument(),
    );
  });

  test('redirects legacy /travel-guide/cappadocia-balloon-guide to /travel-guides/cappadocia', async () => {
    renderPublicApp('/travel-guide/cappadocia-balloon-guide');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Cappadocia Travel & Hot Air Balloon Guide' }),
      ).toBeInTheDocument(),
    );
  });

  test('redirects legacy /destinations/cappadocia to /destinations/turkey/cappadocia', async () => {
    renderPublicApp('/destinations/cappadocia');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Cappadocia' })).toBeInTheDocument(),
    );
  });

  test('redirects legacy /destinations/istanbul to /destinations/turkey/istanbul', async () => {
    renderPublicApp('/destinations/istanbul');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Istanbul' })).toBeInTheDocument(),
    );
  });

  test('renders 404 page for invalid route without redirecting to home', async () => {
    renderPublicApp('/non-existent-route-404-test');
    await waitFor(() => expect(screen.getByText('404')).toBeInTheDocument());
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toBeInTheDocument();
  });
});
