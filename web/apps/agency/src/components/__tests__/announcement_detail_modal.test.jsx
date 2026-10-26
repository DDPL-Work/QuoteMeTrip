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

describe('Agency Portal - Announcement Detail Modal & Notification Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleAgencyAnnouncement = {
    id: 301,
    eventType: 'ANNOUNCEMENT_BROADCAST',
    title: 'Agency Commission & Payout Policy Update',
    body: 'Please review the updated marketplace fee structure and scheduled weekly payout cycles effective November 1st.',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    data: {
      announcementId: 77,
      type: 'important',
      priority: 'high',
      targetAudience: 'agencies',
      actionLabel: 'Review Commission Policy',
      actionUrl: '/commissions',
      titleTr: 'Acente Komisyon ve Ödeme Politikası Güncellemesi',
      messageTr: '1 Kasım itibarıyla geçerli olacak güncellenmiş pazar yeri ücret yapısını ve haftalık ödeme takvimini inceleyiniz.',
      actionLabelTr: 'Politikayı İncele',
    },
  };

  const sampleAgencyRequestNotification = {
    id: 402,
    eventType: 'NEW_TRAVEL_REQUEST_MATCHED',
    title: 'New Travel Request Matched',
    body: 'A traveller submitted a 7-day Cappadocia itinerary matching your coverage area.',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    requestId: 88,
    deepLink: '/requests/88',
  };

  test('1. Clicking an announcement notification opens the detail modal and marks it read', async () => {
    mockList.mockResolvedValueOnce({
      data: [sampleAgencyAnnouncement],
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
      expect(screen.getByText('Agency Commission & Payout Policy Update')).toBeInTheDocument();
    });

    // Click agency announcement notification
    const announcementItem = screen.getByText('Agency Commission & Payout Policy Update');
    fireEvent.click(announcementItem);

    // markRead must be called with item.id (301)
    expect(mockMarkRead).toHaveBeenCalledWith(301);
    expect(handleUnreadChange).toHaveBeenCalled();

    // Verify modal is opened with dialog role
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Review Commission Policy')).toBeInTheDocument();
    });

    // Verify navigation was NOT triggered
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('2. The full announcement body is readable even when dropdown preview is clamped', async () => {
    const fullText =
      'Extensive instructions for agencies regarding invoice submission, tax documents, and insurance guarantees. All details must be verified by licensed agency managers.';

    const longNotice = {
      ...sampleAgencyAnnouncement,
      id: 305,
      body: fullText,
    };

    mockList.mockResolvedValueOnce({
      data: [longNotice],
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
      expect(screen.getByText('Agency Commission & Payout Policy Update')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Agency Commission & Payout Policy Update'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(fullText)).toBeInTheDocument();
    });
  });

  test('3. Regular travel-request notification preserves existing agency portal navigation', async () => {
    mockList.mockResolvedValueOnce({
      data: [sampleAgencyRequestNotification],
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
      expect(screen.getByText('New Travel Request Matched')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Travel Request Matched'));

    // Regular notification should navigate to /requests/88
    expect(mockNavigate).toHaveBeenCalledWith('/requests/88');
    // Modal should not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('4. Modal closes and returns to current agency page on close button click', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={handleClose}
          announcement={sampleAgencyAnnouncement}
        />
      </MemoryRouter>,
    );

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('5. Modal closes on Escape key', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <AnnouncementDetailModal
          isOpen={true}
          onClose={handleClose}
          announcement={sampleAgencyAnnouncement}
        />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('6. Action button opens agency link when clicked', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    const externalAnnouncement = {
      ...sampleAgencyAnnouncement,
      data: {
        ...sampleAgencyAnnouncement.data,
        actionUrl: 'https://docs.quotemetrip.com/agency-guide',
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

    const actionBtn = screen.getByText('Review Commission Policy');
    fireEvent.click(actionBtn);

    expect(window.open).toHaveBeenCalledWith(
      'https://docs.quotemetrip.com/agency-guide',
      '_blank',
      'noopener,noreferrer',
    );
    window.open = originalOpen;
  });
});
