/**
 * Traveller Public Website Frontend Tests (Track B).
 *
 * Behavioral tests for public pages, routing, layouts, CTA redirects,
 * mobile drawer navigation, i18n switching, and contact privacy protection.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { PublicLayout } from '../../../layouts/PublicLayout.jsx';
import { PublicHomePage } from '../../../pages/public/HomePage.jsx';
import { DestinationsPage } from '../../../pages/public/DestinationsPage.jsx';
import { DestinationDetailPage } from '../../../pages/public/DestinationDetailPage.jsx';
import { TravelGuidePage } from '../../../pages/public/TravelGuidePage.jsx';
import { TravelGuideDetailPage } from '../../../pages/public/TravelGuideDetailPage.jsx';
import { AgenciesPage } from '../../../pages/public/AgenciesPage.jsx';
import { AgencyDetailPage } from '../../../pages/public/AgencyDetailPage.jsx';
import { AboutPage } from '../../../pages/public/AboutPage.jsx';
import { ContactPage } from '../../../pages/public/ContactPage.jsx';

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
  setUnauthorizedListener: vi.fn(),
}));

function renderPublicApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider>
        <AuthProvider role="traveller">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicHomePage />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
              <Route path="/travel-guide" element={<TravelGuidePage />} />
              <Route path="/travel-guide/:slug" element={<TravelGuideDetailPage />} />
              <Route path="/agencies" element={<AgenciesPage />} />
              <Route path="/agencies/:id" element={<AgencyDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
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

describe('Public Website Navigation & Homepage', () => {
  test('renders homepage hero, destinations, guide, and agencies', async () => {
    renderPublicApp('/');
    await waitFor(() => expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument());
    expect(screen.getByText('Popular routes')).toBeInTheDocument();
    expect(screen.getByText('How Troublefree Holiday works')).toBeInTheDocument();
    expect(screen.getByText('Your trip status, from start to finish')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });

  test('unauthenticated Plan My Trip button points to login with redirect parameter', async () => {
    renderPublicApp('/');
    await waitFor(() => expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument());
    const cta = screen.getAllByRole('link', { name: /Plan My Trip/i })[0];
    expect(cta).toHaveAttribute('href', '/login?redirect=/plan-trip');
  });

  test('mobile menu button expands navigation links', async () => {
    const user = userEvent.setup({ delay: null });
    renderPublicApp('/');
    await waitFor(() => expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument());

    const toggle = screen.getByRole('button', { name: /Toggle navigation menu/i });
    expect(toggle).toBeInTheDocument();
    await user.click(toggle);

    const mobileNav = screen.getByRole('navigation', { name: /Mobile Navigation/i });
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav).toHaveTextContent('Home');
    expect(mobileNav).toHaveTextContent('Destinations');
  });

  test('language switcher switches between EN and TR', async () => {
    const user = userEvent.setup({ delay: null });
    renderPublicApp('/');
    await waitFor(() => expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument());

    const trBtn = screen.getAllByRole('button', { name: 'TR' })[0];
    await user.click(trBtn);

    await waitFor(() => expect(screen.getAllByText('Destinasyonlar')[0]).toBeInTheDocument());
  });
});

describe('Destinations', () => {
  test('renders destinations list page and handles search filtering', async () => {
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

  test('renders destination detail page with overview and CTA', async () => {
    renderPublicApp('/destinations/cappadocia');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Cappadocia' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText(/Fairy chimneys, hot air balloons/)).toBeInTheDocument();
    expect(screen.getByText('Plan a Trip to Cappadocia →')).toBeInTheDocument();
  });
});

describe('Travel Guide', () => {
  test('renders travel guide list page and article cards', async () => {
    renderPublicApp('/travel-guide');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Travel Guide' })).toBeInTheDocument(),
    );
    expect(
      screen.getByText('The Ultimate 10-Day First-Timer Itinerary for Turkey'),
    ).toBeInTheDocument();
  });

  test('renders guide detail article page', async () => {
    renderPublicApp('/travel-guide/cappadocia-balloon-guide');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Complete Guide to Hot Air Ballooning in Cappadocia',
        }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/Floating over Cappadocia's surreal landscape/)).toBeInTheDocument();
  });
});

describe('Agencies', () => {
  test('renders agencies list page with public cards', async () => {
    renderPublicApp('/agencies');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: /Travel Agencies/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Anatolia Heritage Travel')).toBeInTheDocument();
    expect(screen.getByText('Turquoise Coast Expeditions')).toBeInTheDocument();
  });

  test('renders public agency profile without exposing private email or phone', async () => {
    renderPublicApp('/agencies/1');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Anatolia Heritage Travel' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/Istanbul, Turkey/)).toBeInTheDocument();
    expect(screen.getByText('Specialties & Services')).toBeInTheDocument();
    expect(
      screen.getByText(/Direct contact details become available after accepting a quotation/),
    ).toBeInTheDocument();

    // Verify private credentials/contact are omitted
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+90/)).not.toBeInTheDocument();
  });
});

describe('About & Contact Pages', () => {
  test('renders About page capabilities', async () => {
    renderPublicApp('/about');
    await waitFor(() => expect(screen.getByText('About Troublefree Holiday')).toBeInTheDocument());
    expect(screen.getByText(/Route-First Itinerary Builder/)).toBeInTheDocument();
    expect(screen.getByText(/Competitive Agency Quotations/)).toBeInTheDocument();
  });

  test('renders Contact page and handles message submission', async () => {
    const user = userEvent.setup({ delay: null });
    renderPublicApp('/contact');
    await waitFor(() => expect(screen.getByText('Contact Us')).toBeInTheDocument());

    const nameInput = screen.getByLabelText(/Your Name/i);
    const emailInput = screen.getByLabelText(/Your Email/i);
    const messageInput = screen.getByLabelText(/Message/i);

    await user.type(nameInput, 'Alex Traveller');
    await user.type(emailInput, 'alex@example.com');
    await user.type(messageInput, 'Hello, I have a question about travel routes.');

    await user.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => expect(screen.getByText('Message Sent')).toBeInTheDocument());
  });
});
