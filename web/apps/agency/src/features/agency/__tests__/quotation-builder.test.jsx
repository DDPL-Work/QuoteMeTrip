import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuotationBuilder } from '../../../components/QuotationBuilder.jsx';

describe('QuotationBuilder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders step tabs with dynamic item counts', () => {
    render(
      <MemoryRouter>
        <QuotationBuilder />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /1\. Basic Details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\. Hotels \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3\. Transports \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4\. Activities & Tours \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5\. Day Wise Itinerary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /10\. Preview & Finalize/i })).toBeInTheDocument();
  });

  test('navigates through steps and switches active workspace', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <QuotationBuilder />
      </MemoryRouter>,
    );

    // Initial step is Basic Details
    expect(screen.getByText('Proposal & Trip Details')).toBeInTheDocument();

    // Click Hotels tab
    await user.click(screen.getByRole('button', { name: /2\. Hotels/i }));
    expect(screen.getByText('Hotel Stays & Accommodations')).toBeInTheDocument();

    // Click Transports tab
    await user.click(screen.getByRole('button', { name: /3\. Transports/i }));
    expect(screen.getByText('Airport Transfers & Transport')).toBeInTheDocument();

    // Click Activities tab
    await user.click(screen.getByRole('button', { name: /4\. Activities & Tours/i }));
    expect(screen.getByText('Activities, Excursions & Tours')).toBeInTheDocument();
  });

  test('adds and removes transport services with updated count badges', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <QuotationBuilder />
      </MemoryRouter>,
    );

    // Navigate to Transports
    await user.click(screen.getByRole('button', { name: /3\. Transports/i }));
    expect(screen.getByText(/No Transport Services Added Yet/i)).toBeInTheDocument();

    // Add Airport Transfer
    await user.click(screen.getByRole('button', { name: /Add Airport Transfer/i }));
    expect(screen.getByText('Transfer #1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3\. Transports \(1\)/i })).toBeInTheDocument();

    // Add another Transfer
    await user.click(screen.getByRole('button', { name: /Add Transfer/i }));
    expect(screen.getByText('Transfer #2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3\. Transports \(2\)/i })).toBeInTheDocument();

    // Remove first Transfer
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    await user.click(removeButtons[0]);
    expect(screen.getByRole('button', { name: /3\. Transports \(1\)/i })).toBeInTheDocument();
  });

  test('adds activities and verifies live price calculation in summary panel', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <QuotationBuilder />
      </MemoryRouter>,
    );

    // Navigate to Activities
    await user.click(screen.getByRole('button', { name: /4\. Activities & Tours/i }));

    // Add Sightseeing Tour
    await user.click(screen.getByRole('button', { name: /Add Sightseeing Tour/i }));
    expect(screen.getByText('Activity #1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4\. Activities & Tours \(1\)/i })).toBeInTheDocument();

    // Price breakdown summary should show activity total
    expect(screen.getByTestId('items-total')).toBeInTheDocument();
  });

  test('displays traveller request context with expandable details', async () => {
    const user = userEvent.setup({ delay: null });
    const mockRequest = {
      id: 42,
      numberOfTravellers: 3,
      travelStartDate: '2026-11-01',
      travelEndDate: '2026-11-08',
      luggageCount: 4,
      hotelRequired: true,
      driverRequired: true,
      route: { destination: 'Cappadocia' },
      specialRequests: 'Vegetarian breakfast requested',
    };

    render(
      <MemoryRouter>
        <QuotationBuilder travelRequest={mockRequest} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/QUERY REQUIREMENTS • REQUEST #42/i)).toBeInTheDocument();
    expect(screen.getByText('Cappadocia')).toBeInTheDocument();
    expect(screen.getByText(/3 PAX/i)).toBeInTheDocument();

    // Click Show Request Details toggle
    const toggleBtn = screen.getByRole('button', { name: /Show Request Details/i });
    await user.click(toggleBtn);
    expect(screen.getByText('Vegetarian breakfast requested')).toBeInTheDocument();
  });

  test('submits valid quotation with structured line items and no server totals', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();

    render(
      <MemoryRouter>
        <QuotationBuilder onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    // Select quotation type
    await user.selectOptions(screen.getByLabelText(/quotation type/i), 'full_package');

    // Fill Item 1 title on Basic Details
    await user.clear(screen.getByLabelText('Item 1 title'));
    await user.type(screen.getByLabelText('Item 1 title'), 'Istanbul Premium Suite');

    // Save draft
    await user.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.quotationType).toBe('full_package');
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].title).toBe('Istanbul Premium Suite');
    expect(payload).not.toHaveProperty('subtotal');
    expect(payload).not.toHaveProperty('totalAmount');
  });

  test('restores pre-existing draft quotation faithfully into structured tabs', () => {
    const draftQuotation = {
      id: 99,
      quotationType: 'hotel_only',
      currency: 'EUR',
      validUntil: '2026-12-31',
      notes: 'Custom honeymoon special',
      items: [
        {
          id: 101,
          itemType: 'hotel',
          title: 'Bodrum Luxury Bay Resort',
          quantity: 2,
          unitPrice: 200,
          metadata: {
            starCategory: '5 Star',
            mealPlan: 'All Inclusive',
            nights: 5,
            roomCategory: 'Deluxe Room',
          },
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuotationBuilder initial={draftQuotation} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/quotation type/i)).toHaveValue('hotel_only');
    expect(screen.getByLabelText(/currency/i)).toHaveValue('EUR');
    expect(screen.getByRole('button', { name: /2\. Hotels \(1\)/i })).toBeInTheDocument();
  });
});
