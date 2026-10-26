import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiEye,
  FiFileText,
  FiCreditCard,
  FiMapPin,
  FiMail,
  FiX,
  FiShield,
} from 'react-icons/fi';
import { adminApi } from '../services/api.js';
import { useI18n } from '@troublefree/i18n';

export function AgenciesPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [agencies, setAgencies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type, agency, reason }
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  const loadAgencies = useCallback(() => {
    setLoading(true);
    adminApi
      .listAgencies({ status, search, page, pageSize: 15 })
      .then((data) => {
        setAgencies(data.items || []);
        setPagination(data.pagination || {});
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load agencies');
        setLoading(false);
      });
  }, [status, search, page]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val) p.set('search', val);
      else p.delete('search');
      p.set('page', '1');
      return p;
    });
  };

  const handleStatusFilter = (val) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val) p.set('status', val);
      else p.delete('status');
      p.set('page', '1');
      return p;
    });
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { type, agency, reason } = actionModal;
    setActionLoading(true);
    setFeedback(null);
    try {
      if (type === 'approve') await adminApi.approveAgency(agency.id);
      if (type === 'reject') await adminApi.rejectAgency(agency.id, reason);
      if (type === 'suspend') await adminApi.suspendAgency(agency.id, reason);
      if (type === 'reactivate') await adminApi.reactivateAgency(agency.id);

      setFeedback({
        type: 'success',
        text: t(
          'admin.agencies.updateSuccess',
          { name: agency.agencyName, type },
          `Agency "${agency.agencyName}" successfully updated to ${type}d.`,
        ),
      });
      setActionModal(null);
      loadAgencies();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: t('admin.agencies.actionFailed', { message: err.message }, `Action failed: ${err.message}`),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick stats
  const metrics = useMemo(() => {
    const total = pagination.totalItems ?? agencies.length;
    const pending = agencies.filter((a) => a.status === 'pending').length;
    const approved = agencies.filter((a) => a.status === 'approved').length;
    const suspended = agencies.filter((a) => a.status === 'suspended').length;
    return { total, pending, approved, suspended };
  }, [agencies, pagination]);

  return (
    <div
      className="admin-agencies-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
    >
      {/* Header */}
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
            <FiUsers /> {t('admin.agencies.eyebrow', 'Agency Directory & Compliance')}
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
            {t('admin.agencies.title', 'Agency Directory & Approval')}
          </h1>
          <p style={{ color: '#64748B', margin: 0, fontSize: '0.95rem', maxWidth: '680px' }}>
            {t(
              'admin.agencies.subtitle',
              'Manage agency onboardings, document verification compliance, and operational account statuses.',
            )}
          </p>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="admin-stats-strip">
        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#E5F2EA', color: '#0C4E28' }}>
            <FiUsers />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value">{metrics.total}</div>
            <div className="admin-mini-stat-label">
              {t('admin.agencies.totalAgencies', 'Total Agencies')}
            </div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <FiAlertTriangle />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value" style={{ color: '#B45309' }}>
              {metrics.pending}
            </div>
            <div className="admin-mini-stat-label">
              {t('admin.agencies.pendingReview', 'Pending Review')}
            </div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <FiCheckCircle />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value" style={{ color: '#15803D' }}>
              {metrics.approved}
            </div>
            <div className="admin-mini-stat-label">
              {t('admin.agencies.approvedActive', 'Approved & Active')}
            </div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <FiXCircle />
          </div>
          <div className="admin-mini-stat-content">
            <div className="admin-mini-stat-value" style={{ color: '#DC2626' }}>
              {metrics.suspended}
            </div>
            <div className="admin-mini-stat-label">
              {t('admin.agencies.suspendedInactive', 'Suspended / Inactive')}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
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
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedback.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-toolbar-card">
        <div className="admin-toolbar-left">
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
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
              placeholder={t('admin.agencies.searchPlaceholder', 'Search by agency name, email, city, country...')}
              value={search}
              onChange={handleSearchChange}
              style={{ paddingLeft: '34px', height: '40px' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="admin-form-select"
              value={status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              style={{ height: '40px', fontSize: '0.85rem' }}
            >
              <option value="">{t('admin.common.allStatuses', 'All Statuses')}</option>
              <option value="pending">{t('status.pending', 'Pending')}</option>
              <option value="approved">{t('status.approved', 'Approved')}</option>
              <option value="suspended">{t('status.suspended', 'Suspended')}</option>
              <option value="rejected">{t('status.rejected', 'Rejected')}</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={loadAgencies}
            disabled={loading}
            style={{ height: '40px' }}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />{' '}
            {t('admin.common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Table Area */}
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
          <div style={{ color: '#64748B', fontWeight: 600 }}>
            {t('admin.agencies.loadingRecords', 'Loading agency records...')}
          </div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <FiAlertTriangle size={36} style={{ color: '#EF4444', marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A' }}>
            {t('admin.agencies.failedToLoad', 'Failed to load agencies')}
          </h3>
          <p style={{ color: '#64748B', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>{error}</p>
          <button type="button" className="admin-btn admin-btn-primary" onClick={loadAgencies}>
            <FiRefreshCw size={14} /> {t('admin.common.tryAgain', 'Try Again')}
          </button>
        </div>
      ) : agencies.length === 0 ? (
        <div className="admin-empty-card">
          <div className="admin-empty-icon-wrap">
            <FiUsers />
          </div>
          <h2 className="admin-empty-title">{t('admin.agencies.emptyTitle', 'No agencies found')}</h2>
          <p className="admin-empty-desc">
            {search || status
              ? t(
                  'admin.agencies.emptyFiltered',
                  'No registered travel agencies match your search and filter criteria.',
                )
              : t(
                  'admin.agencies.emptyAll',
                  'There are currently no agencies registered on the QuoteMeTrip platform.',
                )}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.agencies.colAgency', 'Agency')}</th>
                <th>{t('admin.agencies.colContact', 'Contact / Email')}</th>
                <th>{t('admin.agencies.colLocation', 'Location')}</th>
                <th>{t('admin.agencies.colStatus', 'Status')}</th>
                <th>{t('admin.agencies.colDocs', 'Docs')}</th>
                <th>{t('admin.agencies.colMemberships', 'Memberships')}</th>
                <th style={{ textAlign: 'right', width: '190px' }}>
                  {t('admin.agencies.colActions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => {
                const isApproved = agency.status === 'approved';
                const isPending = agency.status === 'pending';
                const isSuspended = agency.status === 'suspended';

                return (
                  <tr key={agency.id}>
                    {/* Agency identity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isApproved ? '#E5F2EA' : '#FEF3C7',
                            color: isApproved ? '#0C4E28' : '#B45309',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {agency.agencyName ? agency.agencyName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Link
                            to={`/agencies/${agency.id}`}
                            style={{
                              color: '#0F172A',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              display: 'block',
                            }}
                          >
                            {agency.agencyName}
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ID #{agency.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Email */}
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {agency.contactPerson && (
                          <div style={{ color: '#0F172A', fontWeight: 600 }}>{agency.contactPerson}</div>
                        )}
                        <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiMail size={12} /> {agency.businessEmail || '—'}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {agency.city || agency.country ? (
                          <>
                            <FiMapPin size={13} style={{ color: '#147D33' }} />
                            <span>
                              {[agency.city, agency.country].filter(Boolean).join(', ')}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className={`admin-badge ${
                          isApproved
                            ? 'admin-badge-success'
                            : isPending
                            ? 'admin-badge-warning'
                            : isSuspended
                            ? 'admin-badge-danger'
                            : 'admin-badge-info'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isApproved ? '#15803D' : isPending ? '#B45309' : '#DC2626',
                          }}
                        />
                        {t('status.' + agency.status, agency.status)}
                      </span>
                      <span className="tf-sr-only">{agency.status}</span>
                    </td>

                    {/* Docs count */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiFileText size={12} />{' '}
                        {t(
                          'admin.agencies.docCount',
                          { count: agency.documents?.length ?? 0 },
                          `${agency.documents?.length ?? 0} doc(s)`,
                        )}
                      </span>
                    </td>

                    {/* Memberships */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: '#E0F2FE',
                          color: '#0369A1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiCreditCard size={12} />{' '}
                        {t(
                          'admin.agencies.membershipCount',
                          { count: agency.memberships?.length ?? 0 },
                          `${agency.memberships?.length ?? 0} record(s)`,
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link
                          to={`/agencies/${agency.id}`}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ textDecoration: 'none', padding: '4px 10px' }}
                        >
                          {t('admin.common.details', 'Details')}
                        </Link>

                        {isPending && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            onClick={() => setActionModal({ type: 'approve', agency })}
                            style={{ padding: '4px 10px' }}
                          >
                            {t('admin.agencies.approve', 'Approve')}
                          </button>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setActionModal({ type: 'suspend', agency })}
                            style={{ padding: '4px 10px', background: '#FC7C00' }}
                          >
                            {t('admin.agencies.suspend', 'Suspend')}
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            onClick={() => setActionModal({ type: 'reactivate', agency })}
                            style={{ padding: '4px 10px' }}
                          >
                            {t('admin.agencies.reactivate', 'Reactivate')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
            {t(
              'admin.common.pageOfAgencies',
              {
                page: pagination.page,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
              },
              `Page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} agencies)`,
            )}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={page <= 1}
              onClick={() => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set('page', String(Math.max(1, Number(page) - 1)));
                  return p;
                });
              }}
            >
              {t('admin.common.previous', 'Previous')}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set('page', String(Number(page) + 1));
                  return p;
                });
              }}
            >
              {t('admin.common.next', 'Next')}
            </button>
          </div>
        </div>
      )}

      {/* Action Modal (Approve, Reject, Suspend, Reactivate) */}
      {actionModal && (
        <div className="admin-modal-backdrop" onClick={() => setActionModal(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiShield style={{ color: '#0C4E28' }} />
                {t(
                  'admin.agencies.confirmModalTitle',
                  { type: actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1) },
                  `Confirm ${actionModal.type}`,
                )}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setActionModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                {t(
                  'admin.agencies.confirmModalMsg',
                  { type: actionModal.type, name: actionModal.agency?.agencyName },
                  `Are you sure you want to ${actionModal.type} the agency ${actionModal.agency?.agencyName}?`,
                )}
              </p>

              {['reject', 'suspend'].includes(actionModal.type) && (
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    {t('admin.agencies.reasonLabel', 'Reason / Administrative Note (Optional):')}
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={3}
                    placeholder={t('admin.agencies.reasonPlaceholder', 'Enter reason for this action...')}
                    value={actionModal.reason || ''}
                    onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setActionModal(null)}
                disabled={actionLoading}
              >
                {t('admin.common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className={`admin-btn ${
                  actionModal.type === 'approve' || actionModal.type === 'reactivate'
                    ? 'admin-btn-primary'
                    : 'admin-btn-danger'
                }`}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading
                  ? t('admin.agencies.processing', 'Processing...')
                  : t(
                      'admin.agencies.confirmModalTitle',
                      { type: actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1) },
                      `Confirm ${actionModal.type}`,
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgenciesPage;
