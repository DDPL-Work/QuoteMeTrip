import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { RequireAuth } from '../features/auth/ProtectedRoute.jsx';
import { TravellerAppLayout } from '../layouts/TravellerAppLayout.jsx';
import { AppHeader } from '../components/AppHeader.jsx';
import { AppSidebar } from '../components/AppSidebar.jsx';
import { MobileBottomNav } from '../components/MobileBottomNav.jsx';
import { NotificationButton } from '../components/NotificationButton.jsx';
import { UserMenu } from '../components/UserMenu.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';
import { LoadingState } from '../components/states/LoadingState.jsx';
import { EmptyState } from '../components/states/EmptyState.jsx';
import { ErrorState } from '../components/states/ErrorState.jsx';
import { Skeleton } from '../components/states/Skeleton.jsx';
import { ToastProvider, useToast } from '../components/feedback/ToastProvider.jsx';
import {
  Button,
  Card,
  TextInput,
  Select,
  Checkbox,
  Radio,
  StatusBadge,
  ConfirmDialog,
  Stepper,
  ProgressBar,
} from '@troublefree/ui';

vi.mock('../lib/api.js', async () => {
  const actual = await vi.importActual('../lib/api.js');
  return {
    ...actual,
    authApi: {
      refresh: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
      me: vi.fn().mockResolvedValue({
        user: {
          id: 1,
          email: 'traveller@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'traveller',
        },
      }),
      login: vi.fn(),
      logout: vi.fn(),
    },
  };
});

function TestToastConsumer() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Test Notification', 'success')}>
      Trigger Toast
    </button>
  );
}

function ProblemChild() {
  throw new Error('Test crash');
}

describe('Phase 1: Traveller Portal Foundation & Shell Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Application renders TravellerAppLayout and shell navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <I18nProvider>
          <AuthProvider role="traveller">
            <Routes>
              <Route
                element={
                  <RequireAuth>
                    <TravellerAppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/app" element={<div>Portal Content</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Content')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Troublefree/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Plan My Trip')).toBeInTheDocument();
    expect(screen.getByText('Travel Requests')).toBeInTheDocument();
  });

  it('2. Desktop Header renders logo, notification button, language switcher, and user menu', async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider role="traveller">
            <AppHeader notificationCount={3} />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/John/i)).toBeInTheDocument();
    });

    expect(screen.getByAltText('Troublefree Holiday')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('3. AppSidebar navigation items render correctly', () => {
    render(
      <MemoryRouter initialEntries={['/plan-trip']}>
        <AppSidebar badges={{ requests: 2, messages: 5 }} />
      </MemoryRouter>,
    );

    const planLink = screen.getByText('Plan My Trip').closest('a');
    expect(planLink).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('4. MobileBottomNav renders items and active link state', () => {
    render(
      <MemoryRouter initialEntries={['/travel-requests']}>
        <MobileBottomNav badges={{ requests: 1 }} />
      </MemoryRouter>,
    );

    const requestsLink = screen.getByText('Requests').closest('a');
    expect(requestsLink).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('5. UserMenu opens dropdown and displays user details', async () => {
    render(
      <MemoryRouter>
        <AuthProvider role="traveller">
          <UserMenu />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/John/i)).toBeInTheDocument();
    });

    const trigger = screen.getByLabelText('User account menu');
    fireEvent.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getByText('traveller@example.com')).toBeInTheDocument();
    expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
  });

  it('6. NotificationButton displays correct counts and overflow text', () => {
    const { rerender } = render(<NotificationButton count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    rerender(<NotificationButton count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<NotificationButton count={15} />);
    expect(screen.getByText('9+')).toBeInTheDocument();

    rerender(<NotificationButton count={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('7. Button system variants, sizes, and states render properly', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" size="lg" onClick={handleClick}>
        Click Me
      </Button>,
    );

    const btn = screen.getByRole('button', { name: 'Click Me' });
    expect(btn).toHaveClass('tf-btn-primary');
    expect(btn).toHaveClass('tf-btn-lg');

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button variant="dark" loading={true}>
        Submitting
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('.tf-btn-spinner')).toBeInTheDocument();
  });

  it('8. Form controls render labels, inputs, and error states correctly', () => {
    render(
      <div>
        <TextInput id="test-input" label="Full Name" error="Name is required" />
        <Select id="test-select" label="Country" options={[{ value: 'tr', label: 'Turkey' }]} />
        <Checkbox id="test-check" label="Accept terms" checked={true} onChange={() => {}} />
        <Radio
          id="test-radio"
          name="test"
          label="Option A"
          value="a"
          checked={false}
          onChange={() => {}}
        />
      </div>,
    );

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Accept terms')).toBeChecked();
    expect(screen.getByLabelText('Option A')).not.toBeChecked();
  });

  it('9. Card primitive supports variants and titles', () => {
    render(
      <Card title="Trip Overview" variant="soft">
        <p>Trip details content</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Trip Overview' })).toBeInTheDocument();
    expect(screen.getByText('Trip details content')).toBeInTheDocument();
  });

  it('10. StatusBadge maps backend statuses to visual labels and tones', () => {
    render(
      <div>
        <StatusBadge status="in_progress" />
        <StatusBadge status="accepted" />
        <StatusBadge status="rejected" />
      </div>,
    );

    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });

  it('11. LoadingState, EmptyState, ErrorState, and Skeleton render as expected', () => {
    const handleRetry = vi.fn();
    render(
      <div>
        <LoadingState message="Fetching requests..." />
        <EmptyState title="No requests found" description="Create a request to start." />
        <ErrorState title="Load failed" message="Network error" onRetry={handleRetry} />
        <Skeleton height="30px" width="200px" />
      </div>,
    );

    expect(screen.getByText('Fetching requests...')).toBeInTheDocument();
    expect(screen.getByText('No requests found')).toBeInTheDocument();
    expect(screen.getByText('Load failed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('12. Modal and ConfirmDialog trigger actions correctly', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Cancel Request?"
        message="Are you sure you want to cancel this travel request?"
        confirmText="Yes, Cancel"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Cancel Request?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('13. ToastProvider manages and displays toast feedback notifications', async () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Toast' }));
    expect(await screen.findByText('Test Notification')).toBeInTheDocument();
  });

  it('14. ErrorBoundary catches component render errors without crashing app', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('15. Stepper and ProgressBar render progress steps correctly', () => {
    render(
      <div>
        <Stepper
          steps={[{ label: 'Route' }, { label: 'Details' }, { label: 'Confirm' }]}
          currentStep={1}
        />
        <ProgressBar progress={50} />
      </div>,
    );

    expect(screen.getByText('Route')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('16. Breadcrumbs and PageHeader render page navigation infrastructure', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Plan Your Journey"
          subtitle="Select your preferred destinations and travel dates."
          breadcrumbItems={[{ label: 'Trips', to: '/app' }, { label: 'Plan' }]}
          actions={<Button variant="primary">Save Draft</Button>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Plan Your Journey' })).toBeInTheDocument();
    expect(
      screen.getByText('Select your preferred destinations and travel dates.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Trips')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
  });
});
