import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DestinationAutocomplete } from '../DestinationAutocomplete.jsx';
import { RouteOverviewSummary } from '../RouteOverviewSummary.jsx';
import { RouteMap } from '../RouteMap.jsx';
import { RoutePlanner } from '../RoutePlanner.jsx';

describe('DestinationAutocomplete', () => {
  test('renders search input with placeholder', () => {
    render(<DestinationAutocomplete placeholder="Search city..." />);
    expect(screen.getByPlaceholderText('Search city...')).toBeInTheDocument();
  });

  test('filters presets when user types and selects destination on click', async () => {
    const handleSelect = vi.fn();
    render(<DestinationAutocomplete onSelect={handleSelect} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Bodrum' } });

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('Bodrum, Muğla, Turkey')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Bodrum, Muğla, Turkey'));
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bodrum',
        latitude: 37.0344,
        longitude: 27.4305,
      }),
    );
  });
});

describe('RouteOverviewSummary', () => {
  const mockRoute = {
    distanceKm: 725.4,
    durationMinutes: 525, // 8h 45m
    recommendedDays: 5,
    legs: [
      {
        index: 0,
        startStopName: 'Istanbul',
        endStopName: 'Bursa',
        distanceKm: 154.2,
        durationMinutes: 130,
      },
      {
        index: 1,
        startStopName: 'Bursa',
        endStopName: 'Bodrum',
        distanceKm: 571.2,
        durationMinutes: 395,
      },
    ],
  };

  const mockStops = [
    { id: '1', name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
    { id: '2', name: 'Bursa', latitude: 40.1885, longitude: 29.0610, type: 'intermediate' },
    { id: '3', name: 'Bodrum', latitude: 37.0344, longitude: 27.4305, type: 'final' },
  ];

  test('renders journey metrics, distance, duration, and recommended days', () => {
    render(<RouteOverviewSummary route={mockRoute} stops={mockStops} />);

    expect(screen.getByText('725.4 km')).toBeInTheDocument();
    expect(screen.getByText(/8 hrs 45 mins/i)).toBeInTheDocument();
    expect(screen.getByText('3 Stops')).toBeInTheDocument();
    expect(screen.getByText('5 Days')).toBeInTheDocument();
  });

  test('toggles detailed leg breakdown accordion', () => {
    render(<RouteOverviewSummary route={mockRoute} stops={mockStops} />);

    const toggleBtn = screen.getByText(/Detailed Leg Breakdown/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Istanbul → Bursa/i)).toBeInTheDocument();
    expect(screen.getByText('154.2 km')).toBeInTheDocument();
    expect(screen.getByText(/Bursa → Bodrum/i)).toBeInTheDocument();
    expect(screen.getByText('571.2 km')).toBeInTheDocument();
  });

  test('shows stale notice and recalculate button when route is modified', () => {
    const handleRecalculate = vi.fn();
    render(
      <RouteOverviewSummary
        route={mockRoute}
        stops={mockStops}
        isStale={true}
        onRecalculate={handleRecalculate}
      />,
    );

    expect(screen.getByText(/Stops changed — recalculate/i)).toBeInTheDocument();
    const recalcBtn = screen.getByRole('button', { name: /Recalculate/i });
    fireEvent.click(recalcBtn);
    expect(handleRecalculate).toHaveBeenCalled();
  });
});

describe('RoutePlanner & RouteMap Integration', () => {
  const stops = [
    { id: 's1', name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
    { id: 's2', name: 'Bodrum', latitude: 37.0344, longitude: 27.4305, type: 'final' },
  ];

  test('renders destination badges with 1 · START and 2 · FINAL', () => {
    render(
      <RoutePlanner
        stops={stops}
        onAddStop={vi.fn()}
        onRemoveStop={vi.fn()}
        onReorderStops={vi.fn()}
        onCalculate={vi.fn()}
      />,
    );

    expect(screen.getByText(/1.*·.*START/)).toBeInTheDocument();
    expect(screen.getByText(/2.*·.*FINAL/)).toBeInTheDocument();
    expect(screen.getAllByText('Istanbul').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bodrum').length).toBeGreaterThanOrEqual(1);
  });

  test('Calculate Route button is active with 2 stops and invokes onCalculate', () => {
    const handleCalculate = vi.fn();
    render(
      <RoutePlanner
        stops={stops}
        onAddStop={vi.fn()}
        onRemoveStop={vi.fn()}
        onReorderStops={vi.fn()}
        onCalculate={handleCalculate}
      />,
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate Route \(2 stops\)/i });
    expect(calcBtn).not.toBeDisabled();
    fireEvent.click(calcBtn);
    expect(handleCalculate).toHaveBeenCalled();
  });

  test('Calculate Route button is disabled when fewer than 2 stops', () => {
    render(
      <RoutePlanner
        stops={[{ id: 's1', name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' }]}
        onAddStop={vi.fn()}
        onRemoveStop={vi.fn()}
        onReorderStops={vi.fn()}
        onCalculate={vi.fn()}
      />,
    );

    const calcBtn = screen.getByRole('button', { name: /Add at least 2 destinations/i });
    expect(calcBtn).toBeDisabled();
  });

  test('RouteMap shows calculating spinner overlay when isCalculating is true', () => {
    render(<RouteMap stops={stops} isCalculating={true} />);
    expect(screen.getByText(/Calculating Google Road Route/i)).toBeInTheDocument();
  });
});
