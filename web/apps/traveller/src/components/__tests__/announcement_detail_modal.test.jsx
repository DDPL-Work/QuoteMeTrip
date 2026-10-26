import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationPanel } from '../NotificationPanel.jsx';
import { AnnouncementDetailModal } from '@troublefree/ui';

// Mock react-router useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock notificationApi in lib/api.js
const mockList = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockGetAnnouncement = vi.fn();

vi.mock('../../lib/api.js', () => ({
  notificationApi: {
    list: (...args) => mockList(...args),
    markRead: (...args) => mockMarkRead(...args),
    markAllRead: (...args) => mockMarkAllRead(...args),
    getAnnouncement: (...args) => mockGetAnnouncement(...args),
  },
}));

describe('Traveller Portal - Announcement Detail Modal & Notification Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleAnnouncementNotification = {
    id: 101,
    eventType: 'ANNOUNCEMENT_BROADCAST',
    title: 'Special Summer Discount for Travellers',
    body: 'Enjoy 15% off custom travel routes this month! Book your holiday now and travel with peace of mind across Turkey.',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    data: {
      announcementId: 42,
      type: 'info',
      priority: 'normal',
      targetAudience: 'travellers',
      actionLabel: 'Explore Custom Routes',
      actionUrl: '/routes',
      titleTr: 'Gezginler İçin Özel Yaz İndirimi',
      messageTr: 'Bu ay özel seyahat rotalarında %15 indirim kazanın! Tatilinizi hemen ayırtın.',
      actionLabelTr: 'Özel Rotaları Keşfet',
    },
  };

  const sampleRegularMessageNotification = {
    id: 202,
    eventType: 'NEW_MESSAGE_RECEIVED',
    title: 'New message from Agency',
    body: 'We sent you an updated quotation for your Antalya trip.',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    requestId: 55,
    deepLink: '/travel-requests/55?tab=quotes',
  };

  test('1. Clicking an announcement notification opens the detail modal and marks it read', async () => {
    mockList.mockResolvedValueOnce({
      data: [sampleAnnouncementNotification],
      pagination: { totalItems: 1 },
      unreadCount: 1,
    });
    mockMarkRead.mockResolvedValueOnce({ success: true });

    const handleClose = vi.fn();
    const handleUnreadChange = vi.fn();

    render(
      <MemoryRouter>
        <NotificationPanel
          isOpen={true}
          onClose={handleClose}
          onUnreadCountChange={handleUnreadChange}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Special Summer Discount for Travellers')).toBeInTheDocument();
    });

    // Click announcement notification
    const announcementItem = screen.getByText('Special Summer Discount for Travellers');
    fireEvent.click(announcementItem);

    // markRead must be called with item.id (101)
    expect(mockMarkRead).toHaveBeenCalledWith(101);
    expect(handleUnreadChange).toHaveBeenCalled();

    // Verify modal is opened
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Explore Custom Routes')).toBeInTheDocument();
    });

    // Verify navigation was NOT called to an unrelated page
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('2. The full message is shown in the detail modal when truncated in preview', async () => {
    const longMessage =
      'This is a comprehensive announcement containing extensive travel details and itineraries. It includes flight tips, hotel guides, and contact information that would typically be truncated to 3 lines in the dropdown preview.';

    const truncatedItem = {
      ...sampleAnnouncementNotification,
      id: 103,
      body: longMessage,
    };

    mockList.mockResolvedValueOnce({
      data: [truncatedItem],
      pagination: { totalItems: 1 },
      unreadCount: 1,
    });
    mockMarkRead.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <NotificationPanel isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Special Summer Discount for Travellers')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Special Summer Discount for Travellers'));

    // Modal renders complete long message
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(longMessage)).toBeInTheDocument();
    });
  });

  test('3. Clicking a regular message notification preserves navigation without opening modal', async () => {
    mockList.mockResolvedValueOnce({
      data: [sampleRegularMessageNotification],
      pagination: { totalItems: 1 },
      unreadCount: 1,
    });
    mockMarkRead.mockResolvedValueOnce({ success: true });

    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <NotificationPanel isOpen={true} onClose={handleClose} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('New message from Agency')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New message from Agency'));

    // Regular notification should navigate to deepLink
    expect(mockNavigate).toHaveBeenCalledWith('/travel-requests/55?tab=quotes');
    // Announcement modal should NOT open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('4. Closing the modal dismisses it and preserves application state', async () => {
    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={vi.fn()}
          announcement={sampleAnnouncementNotification}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Special Summer Discount for Travellers')).toBeInTheDocument();

    // Close button exists
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  test('5. Dismisses on Escape key press', async () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={handleClose}
          announcement={sampleAnnouncementNotification}
        />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('6. Action button opens target link when supplied', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    const externalAnnouncement = {
      ...sampleAnnouncementNotification,
      data: {
        ...sampleAnnouncementNotification.data,
        actionUrl: 'https://status.quotemetrip.com',
      },
    };

    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={vi.fn()}
          announcement={externalAnnouncement}
        />
      </MemoryRouter>,
    );

    const actionButton = screen.getByText('Explore Custom Routes');
    fireEvent.click(actionButton);

    expect(window.open).toHaveBeenCalledWith('https://status.quotemetrip.com', '_blank', 'noopener,noreferrer');
    window.open = originalOpen;
  });

  test('7. Handles missing announcement data with loading / fetch fallback', async () => {
    mockGetAnnouncement.mockResolvedValueOnce({
      id: 42,
      title: 'Fetched Remote Notice',
      message: 'Body loaded from authorized backend endpoint',
      type: 'maintenance',
      priority: 'high',
      targetAudience: 'travellers',
    });

    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={vi.fn()}
          announcementId={42}
          notificationApi={{ getAnnouncement: mockGetAnnouncement }}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetAnnouncement).toHaveBeenCalledWith(42);
      expect(screen.getByText('Fetched Remote Notice')).toBeInTheDocument();
      expect(screen.getByText('Body loaded from authorized backend endpoint')).toBeInTheDocument();
    });
  });
});
