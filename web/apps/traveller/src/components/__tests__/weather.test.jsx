import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WeatherCard } from '../WeatherCard.jsx';
import { weatherApi } from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  weatherApi: {
    getForecast: vi.fn(),
  },
}));

describe('WeatherCard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('STATE A — renders empty/not-ready state when no destination is provided', () => {
    render(<WeatherCard destination="" date="" />);
    expect(screen.getByTestId('weather-card-empty')).toBeInTheDocument();
    expect(
      screen.getByText('Add a destination and travel date to see the weather forecast.'),
    ).toBeInTheDocument();
  });

  test('STATE B & C — renders loading state and then successful weather data', async () => {
    weatherApi.getForecast.mockResolvedValueOnce({
      available: true,
      destination: 'Dehradun',
      date: '2026-10-15',
      temperature: 26,
      minTemperature: 18,
      maxTemperature: 28,
      condition: 'Sunny',
      precipitationProbability: 10,
      windSpeed: 12,
      weatherCode: 1000,
      iconKey: 'sunny',
    });

    render(<WeatherCard destination="Dehradun" date="2026-10-15" />);

    // Should show loading text initially or resolve to success
    await waitFor(() => {
      expect(screen.getByTestId('weather-card-success')).toBeInTheDocument();
    });

    expect(screen.getByText('26°C')).toBeInTheDocument();
    expect(screen.getByText('Sunny')).toBeInTheDocument();
    expect(screen.getByText('18° / 28°')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
    expect(weatherApi.getForecast).toHaveBeenCalledWith('Dehradun', '2026-10-15');
  });

  test('STATE D — renders graceful error/unavailable state when API fails', async () => {
    weatherApi.getForecast.mockResolvedValueOnce({
      available: false,
      reason: 'WEATHER_UNAVAILABLE',
    });

    render(<WeatherCard destination="UnknownCity" date="2026-10-15" />);

    await waitFor(() => {
      expect(screen.getByTestId('weather-card-error')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Weather information is temporarily unavailable. Trip planning continues unaffected.',
      ),
    ).toBeInTheDocument();
  });

  test('STATE E — supports multi-destination tabs and switches active forecast', async () => {
    weatherApi.getForecast
      .mockResolvedValueOnce({
        available: true,
        destination: 'Delhi',
        temperature: 30,
        condition: 'Clear',
      })
      .mockResolvedValueOnce({
        available: true,
        destination: 'Jaipur',
        temperature: 32,
        condition: 'Sunny',
      });

    const user = userEvent.setup();
    render(<WeatherCard destinations={['Delhi', 'Jaipur']} date="2026-10-15" />);

    await waitFor(() => {
      expect(screen.getByText('30°C')).toBeInTheDocument();
    });

    // Click Jaipur tab
    const jaipurTab = screen.getByRole('button', { name: 'Jaipur' });
    await user.click(jaipurTab);

    await waitFor(() => {
      expect(screen.getByText('32°C')).toBeInTheDocument();
    });

    expect(weatherApi.getForecast).toHaveBeenCalledWith('Jaipur', '2026-10-15');
  });
});
