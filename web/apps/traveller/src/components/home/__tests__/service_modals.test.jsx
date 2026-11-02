import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripRequestModal, SERVICE_CONFIGS } from '../TripRequestModal.jsx';
import { HeroDurationField } from '../HeroDurationField.jsx';
import { HeroTravellersField } from '../HeroTravellersField.jsx';

describe('Trip Request Service Modals & Editable Inputs', () => {
  describe('HeroDurationField and HeroTravellersField fully editable behavior', () => {
    test('HeroTravellersField allows replacing 1 with 8 without becoming 18', async () => {
      const user = userEvent.setup();
      let currentVal = 1;
      const handleChange = vi.fn((val) => {
        currentVal = val;
      });

      const { rerender } = render(
        <HeroTravellersField value={currentVal} onChange={handleChange} />,
      );

      const input = screen.getByLabelText(/Travellers/i);
      expect(input.value).toBe('1');

      // Clear the field and type 8
      await user.clear(input);
      await user.type(input, '8');

      expect(input.value).toBe('8');
      expect(handleChange).toHaveBeenCalledWith(8);
      expect(input.value).not.toBe('18');
    });

    test('HeroDurationField allows clearing and typing replacement value', async () => {
      const user = userEvent.setup();
      let currentVal = 7;
      const handleChange = vi.fn((val) => {
        currentVal = val;
      });

      render(<HeroDurationField value={currentVal} onChange={handleChange} />);

      const input = screen.getByLabelText(/Duration/i);
      expect(input.value).toBe('7');

      await user.clear(input);
      await user.type(input, '14');

      expect(input.value).toBe('14');
      expect(handleChange).toHaveBeenCalledWith(14);
    });
  });

  describe('TripRequestModal distinct service modal configurations', () => {
    const services = [
      'Blue Cruise',
      'Full package',
      'Hotel only',
      'Vehicle + driver',
      'Guide & activities',
    ];

    services.forEach((serviceName) => {
      test(`renders distinct modal configuration for ${serviceName}`, () => {
        const config = SERVICE_CONFIGS[serviceName];
        render(
          <TripRequestModal
            isOpen={true}
            serviceName={serviceName}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
          />,
        );

        expect(screen.getByText(config.title)).toBeInTheDocument();
        expect(screen.getByText(config.badge)).toBeInTheDocument();

        // Check specific fields
        if (serviceName === 'Blue Cruise') {
          expect(screen.getByText(/Blue Cruise Preferences/i)).toBeInTheDocument();
          expect(screen.getByText(/Itinerary Duration/i)).toBeInTheDocument();
        } else if (serviceName === 'Hotel only') {
          expect(screen.getByText(/Accommodation Preferences/i)).toBeInTheDocument();
          expect(screen.getByText(/Hotel Rating Class/i)).toBeInTheDocument();
        } else if (serviceName === 'Vehicle + driver') {
          expect(screen.getByText(/Chauffeur & Vehicle Specifications/i)).toBeInTheDocument();
          expect(screen.getByPlaceholderText(/Istanbul Airport/i)).toBeInTheDocument();
        } else if (serviceName === 'Guide & activities') {
          expect(screen.getByText(/Excursion & Guide Requirements/i)).toBeInTheDocument();
          expect(screen.getByText(/Activity Category/i)).toBeInTheDocument();
        } else if (serviceName === 'Full package') {
          expect(screen.getByText(/Complete Package Inclusions/i)).toBeInTheDocument();
        }
      });
    });

    test('submits valid customized payload and preserves serviceType', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TripRequestModal
          isOpen={true}
          serviceName="Blue Cruise"
          initialData={{ country: 'Türkiye', daysCount: 7, travellers: 4 }}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /Continue to Quotes/i });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const submitted = handleSubmit.mock.calls[0][0];
      expect(submitted.packageType).toBe('blue_cruise');
      expect(submitted.cruiseDuration).toBe('4d_3n');
      expect(submitted.numberOfTravellers).toBe(4);
      expect(submitted.country).toBe('Türkiye');
    });

    test('supports preset pills and custom days/nights in Blue Cruise', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TripRequestModal
          isOpen={true}
          serviceName="Blue Cruise"
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />,
      );

      // Select preset pill "6 Days / 5 Nights"
      const preset6d = screen.getByRole('button', { name: '6 Days / 5 Nights' });
      await user.click(preset6d);

      expect(screen.getAllByText(/6 Days \/ 5 Nights/i).length).toBeGreaterThan(0);

      // Enter custom nights
      const nightsInput = screen.getByLabelText(/Cruise Nights/i);
      await user.clear(nightsInput);
      await user.type(nightsInput, '8');

      const submitBtn = screen.getByRole('button', { name: /Continue to Quotes/i });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const submitted = handleSubmit.mock.calls[0][0];
      expect(submitted.cruiseDuration).toBe('6d_8n');
      expect(submitted.cruiseNights).toBe(8);
      expect(submitted.specialRequests).toContain('Cruise Duration: 6 Days / 8 Nights');
    });

    test('supports searchable multi-select and custom activity entry in Guide & activities', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TripRequestModal
          isOpen={true}
          serviceName="Guide & activities"
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />,
      );

      // Type a custom activity and hit Enter
      const searchInput = screen.getByPlaceholderText(/Search or type custom activity/i);
      await user.type(searchInput, 'Private Sunset Yacht Tour{enter}');

      expect(screen.getByText('Private Sunset Yacht Tour')).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Continue to Quotes/i });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const submitted = handleSubmit.mock.calls[0][0];
      expect(submitted.packageType).toBe('guide_activities');
      expect(submitted.activities).toContain('Private Sunset Yacht Tour');
      expect(submitted.specialRequests).toContain('Private Sunset Yacht Tour');
    });

    test('supports custom yacht specification in Blue Cruise', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TripRequestModal
          isOpen={true}
          serviceName="Blue Cruise"
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />,
      );

      // Select Custom Yacht using specific select
      const selects = screen.getAllByRole('combobox');
      const cabinSelect = selects[selects.length - 1];
      await user.selectOptions(cabinSelect, 'custom');

      const customInput = screen.getByPlaceholderText(/Specify yacht details/i);
      await user.type(customInput, '4-cabin modern catamaran with skipper');

      const submitBtn = screen.getByRole('button', { name: /Continue to Quotes/i });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const submitted = handleSubmit.mock.calls[0][0];
      expect(submitted.cruiseCabinType).toBe('4-cabin modern catamaran with skipper');
      expect(submitted.specialRequests).toContain('Custom: 4-cabin modern catamaran with skipper');
    });
  });
});
