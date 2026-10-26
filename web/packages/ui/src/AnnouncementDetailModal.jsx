/**
 * QuoteMeTrip Shared Announcement Detail Modal
 *
 * Dedicated modal window for displaying complete announcements and broadcast notices
 * across Traveller and Agency portals with type-aware visuals, bilingual EN/TR support,
 * recipient audience badges, and accessible modal semantics.
 */
import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@troublefree/i18n';
import {
  FiX,
  FiBell,
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiAlertCircle,
  FiBriefcase,
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiCheck,
} from 'react-icons/fi';

function getVisuals(type) {
  const normType = (type || 'general').toLowerCase();
  switch (normType) {
    case 'urgent':
      return {
        labelKey: 'announcements.typeUrgent',
        defaultLabel: 'Urgent Notice',
        icon: <FiAlertCircle size={18} />,
        color: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5',
      };
    case 'important':
      return {
        labelKey: 'announcements.typeImportant',
        defaultLabel: 'Important Notice',
        icon: <FiAlertCircle size={18} />,
        color: '#EA580C',
        bg: '#FFEDD5',
        border: '#FDBA74',
      };
    case 'maintenance':
      return {
        labelKey: 'announcements.typeMaintenance',
        defaultLabel: 'System Maintenance',
        icon: <FiBriefcase size={18} />,
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FCD34D',
      };
    case 'info':
      return {
        labelKey: 'announcements.typeInfo',
        defaultLabel: 'Information',
        icon: <FiFileText size={18} />,
        color: '#2563EB',
        bg: '#DBEAFE',
        border: '#93C5FD',
      };
    default:
      return {
        labelKey: 'announcements.typeGeneral',
        defaultLabel: 'General Notice',
        icon: <FiBell size={18} />,
        color: '#0C4E28',
        bg: '#E5F2EA',
        border: '#A7D7B8',
      };
  }
}

function getAudienceBadge(audience, t) {
  const aud = (audience || 'all').toLowerCase();
  if (aud === 'travellers') {
    return {
      label: t('announcements.audienceTravellers', 'Travellers Only'),
      color: '#0C4E28',
      bg: '#E5F2EA',
    };
  }
  if (aud === 'agencies') {
    return {
      label: t('announcements.audienceAgencies', 'Agencies Only'),
      color: '#B45309',
      bg: '#FEF3C7',
    };
  }
  return {
    label: t('announcements.audienceAll', 'All Users'),
    color: '#3B82F6',
    bg: '#EFF6FF',
  };
}

function formatDate(dateString, locale) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function AnnouncementDetailModal({
  isOpen,
  onClose,
  announcement: initialAnnouncement,
  announcementId,
  notificationApi,
  onRead,
}) {
  const { locale, t } = useI18n();
  const [data, setData] = useState(initialAnnouncement || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const closeButtonRef = useRef(null);

  // Sync or fetch details
  useEffect(() => {
    if (!isOpen) return;

    if (initialAnnouncement) {
      setData(initialAnnouncement);
      setError(null);
      return;
    }

    if (announcementId && notificationApi?.getAnnouncement) {
      setLoading(true);
      setError(null);
      notificationApi
        .getAnnouncement(announcementId)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error('[AnnouncementDetailModal] Fetch error:', err);
          setError(err.message || t('announcements.errorLoading', 'Unable to load announcement details.'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, initialAnnouncement, announcementId, notificationApi]);

  // Escape key listener & focus management
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract fields handling both Notification record and Announcement record shapes
  const rawData = data?.data && typeof data.data === 'object' ? data.data : {};
  const isTr = locale === 'tr';

  const type = data?.type || rawData.type || 'general';
  const priority = data?.priority || rawData.priority || 'normal';
  const audience = data?.targetAudience || rawData.targetAudience || 'all';

  const title = isTr && (data?.titleTr || rawData.titleTr)
    ? data?.titleTr || rawData.titleTr
    : data?.title || 'Announcement';

  const body = isTr && (data?.messageTr || rawData.messageTr)
    ? data?.messageTr || rawData.messageTr
    : data?.message || data?.body || '';

  const actionUrl = data?.actionUrl || rawData.actionUrl || data?.deepLink || rawData.deepLink || null;
  const actionLabel = isTr && (data?.actionLabelTr || rawData.actionLabelTr)
    ? data?.actionLabelTr || rawData.actionLabelTr
    : data?.actionLabel || rawData.actionLabel || t('announcements.actionButton', 'Open Action Link');

  const publishedAt = data?.publishedAt || rawData.publishedAt || data?.createdAt || null;
  const expiresAt = data?.expiresAt || rawData.expiresAt || null;
  const isRead = Boolean(data?.isRead || data?.readAt);

  const visuals = getVisuals(type);
  const audienceBadge = getAudienceBadge(audience, t);

  const handleActionClick = () => {
    if (!actionUrl) return;
    if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
      window.open(actionUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = actionUrl;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'tfModalBackdropFadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(90vh, 720px)',
          background: '#FFFBF3',
          borderRadius: '20px',
          border: '1px solid #E2DCD1',
          boxShadow: '0 24px 60px rgba(12, 78, 40, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'tfModalCardSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #E2DCD1',
            background: '#FFFFFF',
            position: 'relative',
          }}
        >
          {/* Eyebrow & Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Type Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: visuals.bg,
                  color: visuals.color,
                  border: `1px solid ${visuals.border}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {visuals.icon} {t(visuals.labelKey, visuals.defaultLabel)}
              </span>

              {/* Audience Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: audienceBadge.bg,
                  color: audienceBadge.color,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                }}
              >
                <FiUsers size={12} /> {audienceBadge.label}
              </span>

              {/* Read / Unread Status Pill */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: isRead ? '#F1F5F9' : '#DCFCE7',
                  color: isRead ? '#64748B' : '#15803D',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                {isRead ? (
                  <>
                    <FiCheck size={11} /> {t('announcements.read', 'Read')}
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#15803D',
                        display: 'inline-block',
                      }}
                    />
                    {t('announcements.unread', 'Unread')}
                  </>
                )}
              </span>
            </div>

            {/* Close Icon Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={t('announcements.close', 'Close')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#4E5754',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3EFE6';
                e.currentTarget.style.color = '#13291C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#4E5754';
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Announcement Title */}
          <h2
            id="announcement-modal-title"
            style={{
              margin: '0 0 6px',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#13291C',
              lineHeight: 1.35,
              fontFamily: 'var(--tf-portal-font-heading, var(--sans, system-ui, sans-serif))',
            }}
          >
            {title}
          </h2>

          {/* Time & Metadata Line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '0.8rem',
              color: '#64748B',
              flexWrap: 'wrap',
            }}
          >
            {publishedAt && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FiClock size={13} style={{ color: '#0C4E28' }} />
                <span>
                  {t('announcements.publishedAt', 'Published')}:{' '}
                  <strong style={{ color: '#13291C' }}>{formatDate(publishedAt, locale)}</strong>
                </span>
              </span>
            )}

            {expiresAt && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar size={13} style={{ color: '#EA580C' }} />
                <span>
                  {t('announcements.expiresOn', 'Expires')}:{' '}
                  <strong style={{ color: '#13291C' }}>{formatDate(expiresAt, locale)}</strong>
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            flex: 1,
            color: '#1E293B',
            fontSize: '0.94rem',
            lineHeight: 1.65,
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #E2DCD1',
                  borderTopColor: '#0C4E28',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  animation: 'tfSpin 0.8s linear infinite',
                }}
              />
              <p style={{ margin: 0 }}>{t('announcements.loading', 'Loading announcement...')}</p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#DC2626',
                background: '#FEF2F2',
                borderRadius: '12px',
                border: '1px solid #FECACA',
              }}
            >
              <FiAlertCircle size={28} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          ) : !body && !data ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
              <p>{t('announcements.notFound', 'Announcement not found or no longer available.')}</p>
            </div>
          ) : (
            <div>
              {/* Full Body Content with Whitespace Preservation */}
              <div
                style={{
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  color: '#1E293B',
                  marginBottom: actionUrl ? '20px' : '0',
                }}
              >
                {body}
              </div>

              {/* Expiry Alert Callout if expired */}
              {expiresAt && new Date(expiresAt) < new Date() && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    color: '#92400E',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiAlertCircle size={16} />
                  <span>This notice has passed its scheduled expiry date.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2DCD1',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            {t('announcements.close', 'Close')}
          </button>

          {/* Optional Action Button */}
          {actionUrl && (
            <button
              type="button"
              onClick={handleActionClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#FC7C00',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(252, 124, 0, 0.28)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E06B00';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(252, 124, 0, 0.38)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FC7C00';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(252, 124, 0, 0.28)';
              }}
            >
              <span>{actionLabel}</span>
              <FiExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tfModalBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tfModalCardSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tfSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
