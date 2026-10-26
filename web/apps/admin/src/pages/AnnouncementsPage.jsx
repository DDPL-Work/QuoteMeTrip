/**
 * QuoteMeTrip Admin Portal — Announcement & Broadcast Center
 * (Workstream 1 & 3 UI Modernization)
 *
 * Allows system administrators to compose, preview, target, publish, and track
 * announcements broadcast to Travellers and Agencies.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiSend,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTrash2,
  FiEdit2,
  FiX,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiRadio,
  FiExternalLink,
  FiBarChart2,
  FiRefreshCw,
  FiArchive,
  FiSearch,
  FiLayers,
  FiCalendar,
  FiGlobe,
} from 'react-icons/fi';
import { adminApi } from '../services/api.js';
import { useI18n } from '@troublefree/i18n';

export function AnnouncementsPage() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false); // create or edit
  const [editingItem, setEditingItem] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState('en'); // 'en' | 'tr'
  const [previewItem, setPreviewItem] = useState(null);
  const [previewLang, setPreviewLang] = useState('en');
  const [confirmPublishItem, setConfirmPublishItem] = useState(null);
  const [statsItem, setStatsItem] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    type: 'general',
    priority: 'normal',
    actionLabel: '',
    actionUrl: '',
    titleTr: '',
    messageTr: '',
    actionLabelTr: '',
    expiresAt: '',
  });

  const loadAnnouncements = useCallback(() => {
    setLoading(true);
    adminApi
      .listAnnouncements({
        page,
        pageSize: 15,
        targetAudience: filterAudience || undefined,
        status: filterStatus || undefined,
      })
      .then((res) => {
        setAnnouncements(res?.items || []);
        setPagination(res?.pagination || {});
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load announcements');
        setLoading(false);
      });
  }, [page, filterAudience, filterStatus]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Client-side quick search filter
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.titleTr?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        a.messageTr?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  // Derived metrics for top strip
  const metrics = useMemo(() => {
    const total = pagination.totalItems ?? announcements.length;
    const published = announcements.filter((a) => a.status === 'published').length;
    const travellers = announcements.filter((a) => a.targetAudience === 'travellers' || a.targetAudience === 'all').length;
    const agencies = announcements.filter((a) => a.targetAudience === 'agencies' || a.targetAudience === 'all').length;
    return { total, published, travellers, agencies };
  }, [announcements, pagination]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      message: '',
      targetAudience: 'all',
      type: 'general',
      priority: 'normal',
      actionLabel: '',
      actionUrl: '',
      titleTr: '',
      messageTr: '',
      actionLabelTr: '',
      expiresAt: '',
    });
    setActiveLangTab('en');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      message: item.message || '',
      targetAudience: item.targetAudience || 'all',
      type: item.type || 'general',
      priority: item.priority || 'normal',
      actionLabel: item.actionLabel || '',
      actionUrl: item.actionUrl || '',
      titleTr: item.titleTr || '',
      messageTr: item.messageTr || '',
      actionLabelTr: item.actionLabelTr || '',
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '',
    });
    setActiveLangTab('en');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setBannerNotice(null);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetAudience: formData.targetAudience,
        type: formData.type,
        priority: formData.priority,
        actionLabel: formData.actionLabel.trim() || null,
        actionUrl: formData.actionUrl.trim() || null,
        titleTr: formData.titleTr.trim() || null,
        messageTr: formData.messageTr.trim() || null,
        actionLabelTr: formData.actionLabelTr.trim() || null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (editingItem) {
        await adminApi.updateAnnouncement(editingItem.id, payload);
        setBannerNotice({
          type: 'success',
          text: `Announcement "${payload.title}" updated successfully.`,
        });
      } else {
        await adminApi.createAnnouncement(payload);
        setBannerNotice({
          type: 'success',
          text: `Announcement "${payload.title}" created as draft.`,
        });
      }
      setModalOpen(false);
      loadAnnouncements();
    } catch (err) {
      setBannerNotice({
        type: 'error',
        text: `Operation failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (item) => {
    setActionLoading(true);
    setBannerNotice(null);
    try {
      const res = await adminApi.publishAnnouncement(item.id);
      setBannerNotice({
        type: 'success',
        text: `Broadcast published! Successfully reached ${res?.recipientCount ?? 0} recipient(s).`,
      });
      setConfirmPublishItem(null);
      loadAnnouncements();
    } catch (err) {
      setBannerNotice({
        type: 'error',
        text: `Publishing broadcast failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (item) => {
    setActionLoading(true);
    setBannerNotice(null);
    try {
      await adminApi.withdrawAnnouncement(item.id);
      setBannerNotice({
        type: 'success',
        text: `Announcement "${item.title}" withdrawn from public circulation.`,
      });
      loadAnnouncements();
    } catch (err) {
      setBannerNotice({
        type: 'error',
        text: `Withdraw failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${item.title}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.deleteAnnouncement(item.id);
      setBannerNotice({
        type: 'success',
        text: `Announcement "${item.title}" deleted.`,
      });
      loadAnnouncements();
    } catch (err) {
      setBannerNotice({
        type: 'error',
        text: `Delete failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openStatsModal = async (item) => {
    setStatsItem(item);
    setStatsData(null);
    setStatsLoading(true);
    try {
      const data = await adminApi.getAnnouncementStats(item.id);
      setStatsData(data);
    } catch (err) {
      setBannerNotice({
        type: 'error',
        text: `Failed to load stats: ${err.message}`,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div
      className="admin-announcements-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div className="admin-eyebrow">
            <FiRadio style={{ animation: 'pulse 2s infinite' }} /> {t('admin.announcements.eyebrow')}
          </div>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 0.35rem 0',
              letterSpacing: '-0.025em',
            }}
          >
            {t('admin.announcements.title')}
          </h1>
          <p
            style={{
              color: '#64748B',
              margin: 0,
              fontSize: '0.95rem',
              maxWidth: '680px',
              lineHeight: 1.5,
            }}
          >
            {t('admin.announcements.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="admin-btn admin-btn-accent"
          style={{
            padding: '0.75rem 1.35rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(252, 124, 0, 0.35)',
          }}
        >
          <FiPlus size={18} /> {t('admin.announcements.newAnnouncement')}
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="admin-stats-strip">
        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#E5F2EA', color: '#0C4E28' }}>
            <FiLayers />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value">{metrics.total}</div>
            <div className="admin-mini-stat-label">{t('admin.announcements.totalBroadcasts')}</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <FiRadio />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value" style={{ color: '#15803D' }}>
              {metrics.published}
            </div>
            <div className="admin-mini-stat-label">{t('admin.announcements.activePublished')}</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#E0F2FE', color: '#0369A1' }}>
            <FiUser />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value">{metrics.travellers}</div>
            <div className="admin-mini-stat-label">{t('admin.announcements.travellerCampaigns')}</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <FiBriefcase />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value">{metrics.agencies}</div>
            <div className="admin-mini-stat-label">{t('admin.announcements.agencyCampaigns')}</div>
          </div>
        </div>
      </div>

      {/* Banner Feedback Notice */}
      {bannerNotice && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: bannerNotice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${bannerNotice.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: bannerNotice.type === 'success' ? '#065F46' : '#991B1B',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {bannerNotice.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            <span>{bannerNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '4px',
            }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="admin-toolbar-card">
        <div className="admin-toolbar-left">
          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px', minWidth: '220px' }}>
            <FiSearch
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              className="admin-form-input"
              placeholder={t('admin.announcements.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', height: '40px' }}
            />
          </div>

          {/* Audience Filter */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="admin-form-select"
              value={filterAudience}
              onChange={(e) => {
                setFilterAudience(e.target.value);
                setPage(1);
              }}
              style={{ height: '40px', fontSize: '0.85rem' }}
            >
              <option value="">{t('admin.announcements.audienceAll')}</option>
              <option value="travellers">{t('admin.announcements.audienceTravellers')}</option>
              <option value="agencies">{t('admin.announcements.audienceAgencies')}</option>
              <option value="all">{t('admin.announcements.audienceBoth')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="admin-form-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              style={{ height: '40px', fontSize: '0.85rem' }}
            >
              <option value="">{t('admin.announcements.statusAll')}</option>
              <option value="published">{t('admin.announcements.statusPublished')}</option>
              <option value="draft">{t('admin.announcements.statusDraft')}</option>
              <option value="withdrawn">{t('admin.announcements.statusWithdrawn')}</option>
              <option value="expired">{t('admin.announcements.statusExpired')}</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={loadAnnouncements}
            disabled={loading}
            title={t('admin.announcements.refresh')}
            style={{ height: '40px', padding: '0 0.85rem' }}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} /> {t('admin.announcements.refresh')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="admin-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid #CBD5E1',
              borderTopColor: '#0C4E28',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginBottom: '1rem',
            }}
          />
          <div style={{ color: '#64748B', fontWeight: 600 }}>{t('admin.announcements.loading')}</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <FiAlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A' }}>{t('admin.common.error')}</h3>
          <p style={{ color: '#64748B', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>{error}</p>
          <button type="button" className="admin-btn admin-btn-primary" onClick={loadAnnouncements}>
            <FiRefreshCw size={14} /> {t('admin.common.tryAgain')}
          </button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="admin-empty-card">
          <div className="admin-empty-icon-wrap">
            <FiRadio />
          </div>
          <h2 className="admin-empty-title">{t('admin.announcements.emptyTitle')}</h2>
          <p className="admin-empty-desc">
            {searchQuery || filterAudience || filterStatus
              ? t('admin.announcements.emptyDesc')
              : t('admin.announcements.emptyAllDesc')}
          </p>
          <button type="button" className="admin-btn admin-btn-accent" onClick={openCreateModal}>
            <FiPlus size={16} /> {t('admin.announcements.newAnnouncement')}
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>{t('admin.announcements.colType')}</th>
                <th>{t('admin.announcements.colContent')}</th>
                <th style={{ width: '130px' }}>{t('admin.announcements.colTarget')}</th>
                <th style={{ width: '120px' }}>{t('admin.announcements.colStatus')}</th>
                <th style={{ width: '140px' }}>{t('admin.announcements.colPublished')}</th>
                <th style={{ width: '130px' }}>{t('admin.announcements.colStats')}</th>
                <th style={{ textAlign: 'right', width: '190px' }}>{t('admin.announcements.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((item) => {
                const isPublished = item.status === 'published';
                const isDraft = item.status === 'draft';
                const isWithdrawn = item.status === 'withdrawn';

                return (
                  <tr key={item.id}>
                    {/* Type Badge */}
                    <td>
                      <span className={`admin-type-pill ${item.type || 'general'}`}>
                        {item.type || 'general'}
                      </span>
                    </td>

                    {/* Title & Preview */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{item.title}</strong>
                          {item.titleTr && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: '#E0F2FE',
                                color: '#0369A1',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                              title={`Turkish title: ${item.titleTr}`}
                            >
                              TR
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.825rem',
                            color: '#64748B',
                            maxWidth: '420px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.message}
                        </div>
                      </div>
                    </td>

                    {/* Audience Badge */}
                    <td>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#334155',
                        }}
                      >
                        {item.targetAudience === 'travellers' ? (
                          <>
                            <FiUser style={{ color: '#0284C7' }} /> {t('admin.announcements.audienceTravellers')}
                          </>
                        ) : item.targetAudience === 'agencies' ? (
                          <>
                            <FiBriefcase style={{ color: '#D97706' }} /> {t('admin.announcements.audienceAgencies')}
                          </>
                        ) : (
                          <>
                            <FiUsers style={{ color: '#15803D' }} /> {t('admin.announcements.audienceBoth')}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status Badge with Pulsing indicator */}
                    <td>
                      <span
                        className={`admin-badge ${
                          isPublished
                            ? 'admin-badge-success'
                            : isDraft
                            ? 'admin-badge-warning'
                            : 'admin-badge-info'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isPublished ? '#15803D' : isDraft ? '#B45309' : '#64748B',
                          }}
                        />
                        {t(`admin.announcements.status${item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : ''}`, item.status)}
                      </span>
                    </td>

                    {/* Timestamps */}
                    <td style={{ fontSize: '0.825rem', color: '#64748B' }}>
                      {item.publishedAt ? (
                        new Date(item.publishedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      ) : (
                        <span style={{ color: '#94A3B8' }}>{t('admin.announcements.notPublished')}</span>
                      )}
                    </td>

                    {/* Stats Button */}
                    <td>
                      {isPublished ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => openStatsModal(item)}
                          style={{ padding: '3px 8px', fontSize: '0.775rem' }}
                        >
                          <FiBarChart2 size={13} /> {t('admin.announcements.viewStats')}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* Live Preview */}
                        <button
                          type="button"
                          className="admin-action-btn"
                          title={t('admin.announcements.previewTitle')}
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewLang('en');
                          }}
                        >
                          <FiEye size={15} />
                        </button>

                        {/* Publish (if draft or withdrawn) */}
                        {!isPublished && (
                          <button
                            type="button"
                            className="admin-action-btn publish"
                            title={t('admin.announcements.publishTitle')}
                            disabled={actionLoading}
                            onClick={() => setConfirmPublishItem(item)}
                          >
                            <FiSend size={15} />
                          </button>
                        )}

                        {/* Withdraw (if published) */}
                        {isPublished && (
                          <button
                            type="button"
                            className="admin-action-btn"
                            title={t('admin.announcements.withdrawTitle')}
                            disabled={actionLoading}
                            onClick={() => handleWithdraw(item)}
                          >
                            <FiArchive size={15} />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          type="button"
                          className="admin-action-btn"
                          title={t('admin.announcements.editTitle')}
                          onClick={() => openEditModal(item)}
                        >
                          <FiEdit2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="admin-action-btn danger"
                          title={t('admin.announcements.deleteTitle')}
                          onClick={() => handleDelete(item)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            {t('admin.announcements.pageOf', {
              page: pagination.page,
              totalPages: pagination.totalPages,
              totalItems: pagination.totalItems,
            })}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('admin.common.previous')}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('admin.common.next')}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          1. CREATE / EDIT MODAL (Fixed Overlay Dialog)
         ===================================================================== */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiRadio style={{ color: '#0C4E28' }} />
                {editingItem ? 'Edit Announcement' : 'New Broadcast Announcement'}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                className="admin-modal-body"
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* 1. Target Audience Selection via Cards */}
                <div>
                  <label className="admin-form-label">
                    Target Recipient Audience <span className="required-star">*</span>
                  </label>
                  <div className="admin-audience-grid" style={{ marginTop: '0.4rem' }}>
                    {/* All Users */}
                    <div
                      className={`admin-audience-card ${formData.targetAudience === 'all' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, targetAudience: 'all' })}
                    >
                      <FiUsers className="admin-audience-card-icon" />
                      <div className="admin-audience-card-title">All Users</div>
                      <div className="admin-audience-card-desc">Travellers & Approved Agencies</div>
                    </div>

                    {/* Travellers Only */}
                    <div
                      className={`admin-audience-card ${formData.targetAudience === 'travellers' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, targetAudience: 'travellers' })}
                    >
                      <FiUser className="admin-audience-card-icon" />
                      <div className="admin-audience-card-title">Travellers Only</div>
                      <div className="admin-audience-card-desc">Active registered travellers</div>
                    </div>

                    {/* Agencies Only */}
                    <div
                      className={`admin-audience-card ${formData.targetAudience === 'agencies' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, targetAudience: 'agencies' })}
                    >
                      <FiBriefcase className="admin-audience-card-icon" />
                      <div className="admin-audience-card-title">Agencies Only</div>
                      <div className="admin-audience-card-desc">Approved travel operators</div>
                    </div>
                  </div>
                </div>

                {/* 2. Type & Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Announcement Type <span className="required-star">*</span>
                    </label>
                    <select
                      className="admin-form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="general">General Announcement</option>
                      <option value="info">Informational Notice</option>
                      <option value="maintenance">Platform Maintenance</option>
                      <option value="important">Important Update</option>
                      <option value="urgent">Urgent Alert</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Priority Level</label>
                    <select
                      className="admin-form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="low">Low</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* 3. Bilingual Content Switcher Tabs */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.6rem',
                    }}
                  >
                    <label className="admin-form-label">Announcement Content</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab('en')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: activeLangTab === 'en' ? '2px solid #0C4E28' : '1px solid #CBD5E1',
                          background: activeLangTab === 'en' ? '#E5F2EA' : '#FFFFFF',
                          color: activeLangTab === 'en' ? '#0C4E28' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        English (Primary) *
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab('tr')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: activeLangTab === 'tr' ? '2px solid #0C4E28' : '1px solid #CBD5E1',
                          background: activeLangTab === 'tr' ? '#E5F2EA' : '#FFFFFF',
                          color: activeLangTab === 'tr' ? '#0C4E28' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Türkçe {formData.titleTr ? '✓' : '(Opsiyonel)'}
                      </button>
                    </div>
                  </div>

                  {/* English Tab */}
                  {activeLangTab === 'en' ? (
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          Title (English) <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. Scheduled System Maintenance on Sunday"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          Message Body (English) <span className="required-star">*</span>
                        </label>
                        <textarea
                          className="admin-form-textarea"
                          rows={4}
                          placeholder="Provide clear details regarding the announcement..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    /* Turkish Tab */
                    <div
                      style={{
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      <div className="admin-form-group">
                        <label className="admin-form-label">Başlık (Türkçe - İsteğe Bağlı)</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="örn. Pazar Günü Planlı Sistem Bakımı"
                          value={formData.titleTr}
                          onChange={(e) => setFormData({ ...formData, titleTr: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">Mesaj İçeriği (Türkçe)</label>
                        <textarea
                          className="admin-form-textarea"
                          rows={4}
                          placeholder="Duyuru ayrıntılarını Türkçe olarak girin..."
                          value={formData.messageTr}
                          onChange={(e) => setFormData({ ...formData, messageTr: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Optional Action Link & Expiry */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Action Button Label (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. View Maintenance Details"
                      value={formData.actionLabel}
                      onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Action Target URL (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="https://... or /jobs"
                      value={formData.actionUrl}
                      onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Expiry Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    className="admin-form-input"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                  <span className="admin-form-hint">
                    Expired notices will automatically hide from in-app notification centers.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                  style={{ minWidth: '130px' }}
                >
                  {actionLoading ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. LIVE NOTIFICATION PREVIEW MODAL
         ===================================================================== */}
      {previewItem && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiEye style={{ color: '#0C4E28' }} /> In-App Notification Preview
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setPreviewItem(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ background: '#FFFBF3' }}>
              {/* Language Switcher in Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  padding: '8px 12px',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2DCD1',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
                  Simulated Recipient Locale:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('en')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: previewLang === 'en' ? '2px solid #0C4E28' : '1px solid #CBD5E1',
                      background: previewLang === 'en' ? '#E5F2EA' : '#FFFFFF',
                      color: previewLang === 'en' ? '#0C4E28' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('tr')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: previewLang === 'tr' ? '2px solid #0C4E28' : '1px solid #CBD5E1',
                      background: previewLang === 'tr' ? '#E5F2EA' : '#FFFFFF',
                      color: previewLang === 'tr' ? '#0C4E28' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Türkçe
                  </button>
                </div>
              </div>

              {/* Exact Card Preview */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1.5px solid #E2DCD1',
                  padding: '1.25rem',
                  boxShadow: '0 4px 16px rgba(12, 78, 40, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.65rem',
                  }}
                >
                  <span className={`admin-type-pill ${previewItem.type || 'general'}`}>
                    {previewItem.type || 'Notice'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Just now</span>
                </div>

                <h3
                  style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                >
                  {previewLang === 'tr' && previewItem.titleTr
                    ? previewItem.titleTr
                    : previewItem.title}
                </h3>

                <p
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  {previewLang === 'tr' && previewItem.messageTr
                    ? previewItem.messageTr
                    : previewItem.message}
                </p>

                {(previewItem.actionUrl || previewItem.actionLabel) && (
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                    <a
                      href={previewItem.actionUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn admin-btn-accent admin-btn-sm"
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {previewLang === 'tr' && previewItem.actionLabelTr
                        ? previewItem.actionLabelTr
                        : previewItem.actionLabel || 'View Details'}{' '}
                      <FiExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setPreviewItem(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. CONFIRM PUBLISH BROADCAST DIALOG
         ===================================================================== */}
      {confirmPublishItem && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmPublishItem(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title" style={{ color: '#0C4E28' }}>
                <FiSend /> Confirm Broadcast
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setConfirmPublishItem(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#E5F2EA',
                  color: '#0C4E28',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  margin: '0 auto 1.25rem',
                }}
              >
                <FiSend />
              </div>

              <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A', fontSize: '1.2rem' }}>
                Broadcast &quot;{confirmPublishItem.title}&quot;?
              </h3>

              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
                This will immediately dispatch persistent in-app notifications and trigger FCM push alerts to{' '}
                <strong>
                  {confirmPublishItem.targetAudience === 'travellers'
                    ? 'all eligible travellers'
                    : confirmPublishItem.targetAudience === 'agencies'
                    ? 'all approved agencies'
                    : 'all travellers and agencies'}
                </strong>
                .
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setConfirmPublishItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-accent"
                onClick={() => handlePublish(confirmPublishItem)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Publishing...' : 'Yes, Broadcast Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. READ & DELIVERY STATS MODAL
         ===================================================================== */}
      {statsItem && (
        <div className="admin-modal-backdrop" onClick={() => setStatsItem(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiBarChart2 style={{ color: '#0C4E28' }} /> Broadcast Analytics
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setStatsItem(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {statsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  Loading broadcast delivery stats...
                </div>
              ) : statsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Campaign</div>
                    <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{statsItem.title}</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-mini-stat" style={{ padding: '1rem' }}>
                      <div className="admin-mini-stat-content">
                        <div className="admin-mini-stat-value" style={{ color: '#0C4E28' }}>
                          {statsData.deliveredCount ?? 0}
                        </div>
                        <div className="admin-mini-stat-label">In-App Delivered</div>
                      </div>
                    </div>

                    <div className="admin-mini-stat" style={{ padding: '1rem' }}>
                      <div className="admin-mini-stat-content">
                        <div className="admin-mini-stat-value" style={{ color: '#15803D' }}>
                          {statsData.readCount ?? 0}
                        </div>
                        <div className="admin-mini-stat-label">Total Read</div>
                      </div>
                    </div>
                  </div>

                  {/* Read Rate Progress Bar */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      <span>Read Rate</span>
                      <span>
                        {statsData.deliveredCount > 0
                          ? Math.round((statsData.readCount / statsData.deliveredCount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      style={{
                        height: '10px',
                        background: '#E2E8F0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #147D33 0%, #0C4E28 100%)',
                          width: `${
                            statsData.deliveredCount > 0
                              ? Math.min(100, Math.round((statsData.readCount / statsData.deliveredCount) * 100))
                              : 0
                          }%`,
                          borderRadius: '999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748B', textAlign: 'center', padding: '1.5rem' }}>
                  No analytics available for this broadcast.
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setStatsItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;
