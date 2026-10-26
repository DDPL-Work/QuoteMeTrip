/**
 * QuoteMyTrip Notification Panel (Traveller Portal)
 *
 * Displays persistent in-app notifications, unread badges, mark-as-read actions,
 * and direct contextual deep linking.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import {
  FiBell,
  FiMessageSquare,
  FiFileText,
  FiCheckCircle,
  FiInbox,
  FiBriefcase,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiExternalLink,
} from 'react-icons/fi';
import { AnnouncementDetailModal } from '@troublefree/ui';
import * as apiModule from '../lib/api.js';
const notificationApi = apiModule?.notificationApi;

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationVisuals(item) {
  const type = item.eventType || '';
  const d = item.data && typeof item.data === 'object' ? item.data : {};

  if (type.includes('ANNOUNCEMENT')) {
    const annType = d.type || 'general';
    if (annType === 'urgent') {
      return {
        icon: <FiAlertCircle size={16} />,
        color: '#DC2626',
        bg: '#FEE2E2',
        badge: 'URGENT',
        badgeBg: '#DC2626',
        badgeColor: '#FFFFFF',
      };
    }
    if (annType === 'important') {
      return {
        icon: <FiAlertCircle size={16} />,
        color: '#EA580C',
        bg: '#FFEDD5',
        badge: 'IMPORTANT',
        badgeBg: '#EA580C',
        badgeColor: '#FFFFFF',
      };
    }
    if (annType === 'maintenance') {
      return {
        icon: <FiBriefcase size={16} />,
        color: '#D97706',
        bg: '#FEF3C7',
        badge: 'MAINTENANCE',
        badgeBg: '#D97706',
        badgeColor: '#FFFFFF',
      };
    }
    if (annType === 'info') {
      return {
        icon: <FiFileText size={16} />,
        color: '#2563EB',
        bg: '#DBEAFE',
        badge: 'INFO',
        badgeBg: '#2563EB',
        badgeColor: '#FFFFFF',
      };
    }
    return {
      icon: <FiBell size={16} />,
      color: '#0C4E28',
      bg: '#E5F2EA',
      badge: 'NOTICE',
      badgeBg: '#0C4E28',
      badgeColor: '#FFFFFF',
    };
  }

  if (type.includes('MESSAGE')) {
    return {
      icon: <FiMessageSquare size={16} />,
      color: '#147D33',
      bg: '#E5F2EA',
    };
  }
  if (type.includes('QUOTATION')) {
    return {
      icon: <FiFileText size={16} />,
      color: '#0C4E28',
      bg: '#E5F2EA',
    };
  }
  if (type.includes('JOB') || type.includes('ACCEPTED')) {
    return {
      icon: <FiCheckCircle size={16} />,
      color: '#FC7C00',
      bg: 'rgba(252, 124, 0, 0.12)',
    };
  }
  if (type.includes('REQUEST')) {
    return {
      icon: <FiInbox size={16} />,
      color: '#13291C',
      bg: '#E5F2EA',
    };
  }
  return {
    icon: <FiAlertCircle size={16} />,
    color: '#4E5754',
    bg: '#E2DCD1',
  };
}

export function NotificationPanel({ isOpen, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { locale } = useI18n();

  const fetchNotifications = async (targetPage = 1, append = false) => {
    setLoading(true);
    try {
      const res = await notificationApi.list({
        page: targetPage,
        limit: 20,
        unreadOnly: filter === 'unread',
      });
      const items = Array.isArray(res) ? res : res?.data || [];
      const total = res?.pagination?.totalItems ?? res?.total ?? items.length;
      const unread = res?.unreadCount ?? items.filter((i) => !i.isRead && !i.readAt).length;

      if (append) {
        setNotifications((prev) => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setTotalCount(total);
      setHasMore(targetPage * 20 < total);
      setPage(targetPage);

      if (onUnreadCountChange && res?.unreadCount !== undefined) {
        onUnreadCountChange(res.unreadCount);
      }
    } catch (err) {
      console.error('[NotificationPanel] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, false);
    }
  }, [isOpen, filter]);

  // Listen for real-time foreground notifications to refresh list immediately without page reload
  useEffect(() => {
    function handleRealtimeNotification() {
      if (isOpen) {
        fetchNotifications(1, false);
      }
    }
    window.addEventListener('qmt:notification:new', handleRealtimeNotification);
    return () => {
      window.removeEventListener('qmt:notification:new', handleRealtimeNotification);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error('[NotificationPanel] markAllRead failed:', err);
    }
  };

  const handleItemClick = (item) => {
    if (!item.isRead && !item.readAt) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
      if (onUnreadCountChange) {
        onUnreadCountChange((prev) => Math.max(0, prev - 1));
      }
      notificationApi?.markRead(item.id).catch((err) => {
        console.warn('markRead error:', err);
      });
    }

    // Identify announcement or notice notification
    const isAnnouncement =
      item.eventType?.includes('ANNOUNCEMENT') ||
      item.eventType?.includes('NOTICE') ||
      Boolean(item.data?.announcementId);

    if (isAnnouncement) {
      setSelectedAnnouncement(item);
      setIsAnnouncementModalOpen(true);
      onClose();
      return;
    }

    onClose();

    // Contextual deep linking for non-announcement items
    const rawData = item.data && typeof item.data === 'object' ? item.data : {};
    const link =
      item.deepLink ||
      rawData.actionUrl ||
      (item.requestId
        ? `/travel-requests/${item.requestId}${item.quotationId ? '?tab=quotes' : ''}`
        : null) ||
      '/';

    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link);
    }
  };

  if (!isOpen && !isAnnouncementModalOpen) return null;

  return (
    <>
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
        maxWidth: '92vw',
        background: '#FFFBF3',
        borderRadius: '16px',
        boxShadow: '0 12px 36px rgba(19, 41, 28, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #E2DCD1',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'clamp(320px, 75dvh, 560px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2DCD1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiBell style={{ color: '#0C4E28', fontSize: '1.1rem' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 700,
              color: '#13291C',
              fontFamily: 'var(--sans, system-ui, sans-serif)',
            }}
          >
            Notifications
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#147D33',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <FiCheck size={14} /> Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            style={{
              background: 'none',
              border: 'none',
              color: '#4E5754',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2DCD1',
          background: '#FFFBF3',
          padding: '4px 12px 0',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: filter === 'all' ? '2px solid #0C4E28' : '2px solid transparent',
            color: filter === 'all' ? '#0C4E28' : '#4E5754',
            fontWeight: filter === 'all' ? 700 : 500,
            fontSize: '0.85rem',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: filter === 'unread' ? '2px solid #0C4E28' : '2px solid transparent',
            color: filter === 'unread' ? '#0C4E28' : '#4E5754',
            fontWeight: filter === 'unread' ? 700 : 500,
            fontSize: '0.85rem',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Unread
        </button>
      </div>

      {/* Notifications List */}
      <div
        style={{
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
          minHeight: 0,
          padding: '6px 0',
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: '#4E5754',
              fontSize: '0.9rem',
            }}
          >
            <FiBell size={28} style={{ opacity: 0.35, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
            {loading ? 'Loading notifications...' : filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.isRead && !item.readAt;
            const visuals = getNotificationVisuals(item);
            const d = item.data && typeof item.data === 'object' ? item.data : {};
            const isTr = locale === 'tr';
            const displayTitle = isTr && d.titleTr ? d.titleTr : item.title;
            const displayBody = isTr && d.messageTr ? d.messageTr : item.body;
            const displayActionLabel = isTr && d.actionLabelTr ? d.actionLabelTr : d.actionLabel || 'View Details';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(226, 220, 209, 0.6)',
                  background: isUnread ? '#FFFFFF' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isUnread ? '#F4FBF6' : '#F7F4EC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isUnread ? '#FFFFFF' : 'transparent';
                }}
              >
                {/* Semantic Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: visuals.bg,
                    color: visuals.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {visuals.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      marginBottom: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      {visuals.badge && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: visuals.badgeBg,
                            color: visuals.badgeColor,
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          {visuals.badge}
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: isUnread ? 700 : 600,
                          fontSize: '0.88rem',
                          color: '#13291C',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayTitle}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#4E5754',
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '0.82rem',
                      color: '#4E5754',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {displayBody}
                  </p>

                  {d.actionUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#0C4E28',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {displayActionLabel} <FiExternalLink size={10} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Unread indicator dot */}
                {isUnread && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#147D33',
                      flexShrink: 0,
                      marginTop: '6px',
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        {hasMore && (
          <div style={{ padding: '8px 16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => fetchNotifications(page + 1, true)}
              disabled={loading}
              style={{
                background: '#E5F2EA',
                color: '#0C4E28',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
      )}

      {isAnnouncementModalOpen && (
        <AnnouncementDetailModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => {
            setIsAnnouncementModalOpen(false);
            setSelectedAnnouncement(null);
          }}
          announcement={selectedAnnouncement}
          announcementId={selectedAnnouncement?.data?.announcementId}
          notificationApi={notificationApi}
        />
      )}
    </>
  );
}
