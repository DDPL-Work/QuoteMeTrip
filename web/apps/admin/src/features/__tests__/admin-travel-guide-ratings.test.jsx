import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from '../auth/AuthContext.jsx';
import { TravelGuideManagementPage } from '../../pages/TravelGuideManagementPage.jsx';
import { RatingOverviewPage } from '../../pages/RatingOverviewPage.jsx';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
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
    listTravelGuideRegions: vi.fn(),
    createTravelGuideRegion: vi.fn(),
    updateTravelGuideRegion: vi.fn(),
    deleteTravelGuideRegion: vi.fn(),
    listTravelGuideDestinations: vi.fn(),
    createTravelGuideDestination: vi.fn(),
    updateTravelGuideDestination: vi.fn(),
    deleteTravelGuideDestination: vi.fn(),
    listTravelGuideArticles: vi.fn(),
    getTravelGuideArticleById: vi.fn(),
    createTravelGuideArticle: vi.fn(),
    updateTravelGuideArticle: vi.fn(),
    publishTravelGuideArticle: vi.fn(),
    unpublishTravelGuideArticle: vi.fn(),
    deleteTravelGuideArticle: vi.fn(),
    listRatings: vi.fn(),
    getRatingSummary: vi.fn(),
  },
  apiBaseUrl: 'http://localhost:5001',
}));

function renderWithProviders(ui) {
  authApi.me.mockResolvedValue({
    id: 1,
    email: 'admin@troublefree.local',
    name: 'Admin User',
    role: 'admin',
  });

  return render(
    <MemoryRouter>
      <I18nProvider initialLocale="en">
        <AuthProvider role="admin">
          {ui}
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('Admin Travel Guide Management Page', () => {
  const mockRegions = [
    { id: 1, name: 'Aegean Coast', slug: 'aegean-coast', status: 'published', sortOrder: 1, description: 'Sun and sea' },
    { id: 2, name: 'Cappadocia Region', slug: 'cappadocia-region', status: 'draft', sortOrder: 2, description: 'Fairy chimneys' },
  ];

  const mockDestinations = [
    { id: 10, regionId: 1, name: 'Bodrum', slug: 'bodrum', country: 'Turkey', status: 'published', sortOrder: 1 },
    { id: 11, regionId: 2, name: 'Goreme', slug: 'goreme', country: 'Turkey', status: 'draft', sortOrder: 2 },
  ];

  const mockArticles = [
    { id: 100, title: 'Top 10 Bodrum Beaches', slug: 'top-10-bodrum-beaches', status: 'published', publishedAt: '2026-05-01', destinationId: 10, content: 'Great sandy beaches.' },
    { id: 101, title: 'Hot Air Balloons Guide', slug: 'hot-air-balloons-guide', status: 'draft', publishedAt: null, regionId: 2, content: 'Fly over valleys.' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.listTravelGuideRegions.mockResolvedValue(mockRegions);
    adminApi.listTravelGuideDestinations.mockResolvedValue(mockDestinations);
    adminApi.listTravelGuideArticles.mockResolvedValue(mockArticles);
  });

  test('renders Travel Guide page with tabs and regions by default', async () => {
    renderWithProviders(<TravelGuideManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Travel Guide Management')).toBeInTheDocument();
      expect(screen.getByText('Aegean Coast')).toBeInTheDocument();
      expect(screen.getByText('Cappadocia Region')).toBeInTheDocument();
    });
  });

  test('can switch to Destinations tab and display loaded destinations', async () => {
    renderWithProviders(<TravelGuideManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Aegean Coast')).toBeInTheDocument();
    });

    const destTab = screen.getByRole('button', { name: /Destinations/i });
    fireEvent.click(destTab);

    await waitFor(() => {
      expect(screen.getByText('Bodrum')).toBeInTheDocument();
      expect(screen.getByText('Goreme')).toBeInTheDocument();
    });
  });

  test('can switch to Articles tab and display loaded articles and actions', async () => {
    renderWithProviders(<TravelGuideManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Aegean Coast')).toBeInTheDocument();
    });

    const artTab = screen.getByRole('button', { name: /Articles/i });
    fireEvent.click(artTab);

    await waitFor(() => {
      expect(screen.getByText('Top 10 Bodrum Beaches')).toBeInTheDocument();
      expect(screen.getByText('Hot Air Balloons Guide')).toBeInTheDocument();
    });
  });

  test('can publish an unpublished article', async () => {
    adminApi.publishTravelGuideArticle.mockResolvedValue({ id: 101, status: 'published' });

    renderWithProviders(<TravelGuideManagementPage />);

    const artTab = screen.getByRole('button', { name: /Articles/i });
    fireEvent.click(artTab);

    await waitFor(() => {
      expect(screen.getByText('Hot Air Balloons Guide')).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByTitle('Publish');
    expect(publishButtons.length).toBeGreaterThan(0);
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(adminApi.publishTravelGuideArticle).toHaveBeenCalledWith(101);
    });
  });
});

describe('Admin Rating Overview Page', () => {
  const mockRatings = [
    {
      id: 1,
      rating: 5,
      jobId: 42,
      travellerId: 7,
      agencyId: 3,
      agency: { id: 3, companyName: 'Aegean Blue Travel' },
      traveller: { id: 7, name: 'Alice Walker' },
      job: { id: 42, status: 'completed' },
      createdAt: '2026-06-15T10:00:00Z',
    },
    {
      id: 2,
      rating: 4,
      jobId: 43,
      travellerId: 8,
      agencyId: 4,
      agency: { id: 4, companyName: 'Cappadocia Balloons Ltd' },
      traveller: { id: 8, name: 'Bob Smith' },
      job: { id: 43, status: 'completed' },
      createdAt: '2026-06-16T12:00:00Z',
    },
  ];

  const mockSummary = {
    totalRatings: 2,
    averageRating: 4.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.listRatings.mockResolvedValue(mockRatings);
    adminApi.getRatingSummary.mockResolvedValue(mockSummary);
  });

  test('renders Rating Overview with summary cards and ratings table', async () => {
    renderWithProviders(<RatingOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Rating & Review Overview')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('Aegean Blue Travel')).toBeInTheDocument();
      expect(screen.getByText('Cappadocia Balloons Ltd')).toBeInTheDocument();
      expect(screen.getByText('Alice Walker')).toBeInTheDocument();
    });
  });

  test('displays score distribution breakdown', async () => {
    renderWithProviders(<RatingOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      expect(screen.getByText('5-Star Perfect Ratings')).toBeInTheDocument();
    });
  });
});

describe('Admin Layout Navigation Integration', () => {
  test('AdminLayout renders navigation links for Travel Guide and Ratings', async () => {
    renderWithProviders(<AdminLayout />);

    await waitFor(() => {
      expect(screen.getByText('Travel Guide')).toBeInTheDocument();
      expect(screen.getByText('Ratings & Reviews')).toBeInTheDocument();
    });
  });
});
