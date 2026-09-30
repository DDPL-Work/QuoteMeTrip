// Blue Cruise & Preloader Frontend Tests

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { TravelRequestForm } from '../../../components/TravelRequestForm.jsx';
import { RequestReview } from '../../../components/RequestReview.jsx';
import { AppPreloader } from '../../../components/loading/AppPreloader.jsx';
import { validateRequestInput } from '../validation.js';

describe('AppPreloader visual & background tests', () => {
  test('renders Code_Generated_Image.gif with #F5FAF7 background color', () => {
    const { container } = render(<AppPreloader isLoading={true} />);
    const preloader = container.querySelector('.app-preloader');
    expect(preloader).toBeInTheDocument();
    expect(preloader).toHaveStyle('background-color: #F5FAF7');

    const img = screen.getByAltText('Loading Troublefree Holiday');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/Code_Generated_Image.gif');
    expect(img).toHaveStyle('max-width: 860px');
  });

  test('fades out smoothly when application is ready', async () => {
    const onComplete = vi.fn();
    const { container } = render(<AppPreloader isLoading={false} onComplete={onComplete} />);
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});

describe('Blue Cruise form selection & duration choices', () => {
  test('Blue Cruise is the first option and displays 4d/3n and 6d/5n duration choices', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MemoryRouter>
        <TravelRequestForm onSubmit={onSubmit} />
      </MemoryRouter>
    );

    // Verify Blue Cruise is first
    const buttons = screen.getAllByRole('button');
    const blueCruiseBtn = buttons.find((b) => b.textContent.includes('Blue Cruise'));
    expect(blueCruiseBtn).toBeInTheDocument();
    expect(blueCruiseBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify duration choices appear
    expect(screen.getByText('Choose your cruise duration')).toBeInTheDocument();
    expect(screen.getByText('4 Days / 3 Nights')).toBeInTheDocument();
    expect(screen.getByText('6 Days / 5 Nights')).toBeInTheDocument();

    // Select 6 Days / 5 Nights
    const sixDayBtn = screen.getByRole('radio', { name: /6 Days \/ 5 Nights/i });
    await user.click(sixDayBtn);

    // Save request
    await user.click(screen.getByText('Save request'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        packageType: 'blue_cruise',
        cruiseDuration: '6d_5n',
      })
    );
  });

  test('validateRequestInput rejects missing duration for blue_cruise', () => {
    const res = validateRequestInput({
      packageType: 'blue_cruise',
      cruiseDuration: '',
    });
    expect(res.cruiseDuration).toBe('Please select a cruise duration.');
  });
});

describe('RequestReview displays Blue Cruise correctly', () => {
  test('renders SERVICE Blue Cruise and DURATION 4 Days / 3 Nights', () => {
    render(
      <RequestReview
        form={{
          packageType: 'blue_cruise',
          cruiseDuration: '4d_3n',
          travelStartDate: '2026-10-01',
          travelEndDate: '2026-10-04',
        }}
      />
    );

    expect(screen.getByText('SERVICE:')).toBeInTheDocument();
    expect(screen.getByText('Blue Cruise')).toBeInTheDocument();
    expect(screen.getByText('DURATION:')).toBeInTheDocument();
    expect(screen.getByText('4 Days / 3 Nights')).toBeInTheDocument();
  });
});
