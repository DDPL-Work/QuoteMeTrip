import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../features/auth/AuthContext.jsx';

import { PublicHomePage } from '../../../pages/public/HomePage.jsx';
import { HomeHero } from '../HomeHero.jsx';
import { HeroSearchPanel } from '../HeroSearchPanel.jsx';
import { HeroTrustStrip } from '../HeroTrustStrip.jsx';
import { PopularRouteCard } from '../PopularRouteCard.jsx';
import { FaqSection } from '../FaqSection.jsx';

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

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <AuthProvider role="traveller">{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('Homepage Componentization & Interaction Tests', () => {
  test('HomePage composition root renders all major sections', () => {
    renderWithProviders(<PublicHomePage />);
    expect(screen.getByText(/Day-by-day holidays/i)).toBeInTheDocument();
    expect(screen.getByText('Popular routes')).toBeInTheDocument();
    expect(screen.getByText('How Troublefree Holiday works')).toBeInTheDocument();
    expect(screen.getByText('With you while you plan')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });

  test('HomeHero renders headline and hero search panel', () => {
    const trip = {
      country: 'Türkiye',
      days: [{}],
      daysCount: 7,
      travellers: 2,
      flexible: false,
      suggest: false,
    };
    renderWithProviders(
      <HomeHero
        trip={trip}
        setTrip={vi.fn()}
        scope="Blue Cruise"
        setScope={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('One request.')).toBeInTheDocument();
    expect(screen.getByText('Multiple travel quotes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get free quotes/i })).toBeInTheDocument();
  });

  test('HeroSearchPanel handles scope switching and input changes', async () => {
    const user = userEvent.setup({ delay: null });
    const setScope = vi.fn();
    const setTrip = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());

    const trip = {
      country: 'Türkiye',
      days: [{ date: '2026-06-01' }],
      daysCount: 7,
      travellers: 2,
      flexible: false,
      suggest: false,
    };

    renderWithProviders(
      <HeroSearchPanel
        trip={trip}
        setTrip={setTrip}
        scope="Blue Cruise"
        setScope={setScope}
        onSubmit={onSubmit}
      />,
    );

    const fullPackageBtn = screen.getByRole('button', { name: /Full package/i });
    await user.click(fullPackageBtn);
    expect(setScope).toHaveBeenCalledWith('Full package');

    const submitBtn = screen.getByRole('button', { name: /Get free quotes/i });
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });

  test('HeroTrustStrip renders all 5 trust items', () => {
    renderWithProviders(<HeroTrustStrip />);
    expect(screen.getByText('Verified agencies')).toBeInTheDocument();
    expect(screen.getByText('Free request')).toBeInTheDocument();
    expect(screen.getByText('Compare offers')).toBeInTheDocument();
    expect(screen.getByText('Pay the agency directly')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  test('PopularRouteCard handles click callbacks', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelect = vi.fn();
    const route = { name: 'Santorini', country: 'Greece', tagline: 'Caldera sunset' };

    renderWithProviders(<PopularRouteCard route={route} onSelectRoute={onSelect} />);

    const card = screen.getByRole('button', { name: /Santorini/i });
    await user.click(card);
    expect(onSelect).toHaveBeenCalledWith(route);
  });

  test('FaqSection toggles accordion item open and closed', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<FaqSection />);

    const questionBtn = screen.getByRole('button', { name: /Is sending a request free\?/i });
    expect(questionBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(questionBtn);
    expect(questionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Creating an itinerary, receiving quotes/i)).toBeInTheDocument();

    await user.click(questionBtn);
    expect(questionBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
