import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiFileText,
  FiCreditCard,
  FiPlus,
  FiX,
  FiMapPin,
  FiMail,
  FiPhone,
  FiGlobe,
  FiCalendar,
  FiCheck,
  FiExternalLink,
  FiArrowLeft,
  FiLayers,
} from 'react-icons/fi';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';
import { useI18n, formatDate } from '@troublefree/i18n';

export function AgencyDetailPage() {
  const { t, locale } = useI18n();
  const { id } = useParams();
  const [agency, setAgency] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [confirmActionModal, setConfirmActionModal] = useState(null); // { type, reason }
  const [rejectDocModal, setRejectDocModal] = useState(null); // { doc, note }
  const [createMemModal, setCreateMemModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [memReference, setMemReference] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAgencyData = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.getAgencyById(id), adminApi.listMembershipPlans()])
      .then(([agencyData, plansData]) => {
        setAgency(agencyData);
        setPlans(plansData || []);
        if (plansData?.length > 0) setSelectedPlanId(String(plansData[0].id));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load agency details');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadAgencyData();
  }, [loadAgencyData]);

  const handleActionConfirm = async () => {
    if (!confirmActionModal) return;
    const { type, reason } = confirmActionModal;
    setActionLoading(true);
    setFeedback(null);
    try {
      if (type === 'approve') await adminApi.approveAgency(id);
      if (type === 'reject') await adminApi.rejectAgency(id, reason);
      if (type === 'suspend') await adminApi.suspendAgency(id, reason);
      if (type === 'reactivate') await adminApi.reactivateAgency(id);

      setFeedback({
        type: 'success',
        text: `Agency successfully ${type}d.`,
      });
      setConfirmActionModal(null);
      loadAgencyData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Action failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDocument = async (docId) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.verifyDocument(id, docId);
      setFeedback({
        type: 'success',
        text: 'Document verified and approved.',
      });
      loadAgencyData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Document verification failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDocumentConfirm = async (e) => {
    e.preventDefault();
    if (!rejectDocModal) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.rejectDocument(id, rejectDocModal.doc.id, rejectDocModal.note);
      setFeedback({
        type: 'success',
        text: 'Document rejected with administrative note.',
      });
      setRejectDocModal(null);
      loadAgencyData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Document rejection failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.createAgencyMembership(id, {
        planId: parseInt(selectedPlanId, 10),
        paymentReference: memReference,
        status: 'pending',
      });
      setFeedback({
        type: 'success',
        text: 'Membership plan successfully assigned to agency.',
      });
      setCreateMemModal(false);
      setMemReference('');
      loadAgencyData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Assigning membership failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
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
          {t('admin.agencyDetail.loading', 'Loading agency details...')}
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="admin-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <FiAlertTriangle size={36} style={{ color: '#EF4444', marginBottom: '0.75rem' }} />
        <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A' }}>
          {t('admin.agencyDetail.notFound', 'Agency not found')}
        </h3>
        <p style={{ color: '#64748B', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
          {error ||
            t(
              'admin.agencyDetail.notFoundDesc',
              'The requested agency record does not exist or has been removed.',
            )}
        </p>
        <Link to="/agencies" className="admin-btn admin-btn-primary">
          <FiArrowLeft size={16} /> {t('admin.agencyDetail.backToAgencies', 'Back to Agency Directory')}
        </Link>
      </div>
    );
  }

  const isApproved = agency.status === 'approved';
  const isPending = agency.status === 'pending';
  const isSuspended = agency.status === 'suspended';

  return (
    <div
      className="admin-agency-detail-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
    >
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/agencies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748B',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <FiArrowLeft size={14} /> {t('admin.agencyDetail.backToAgencies', 'Back to Agency Directory')}
        </Link>
      </div>

      {/* Top Header Card */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: isApproved ? '#E5F2EA' : '#FEF3C7',
              color: isApproved ? '#0C4E28' : '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            {agency.agencyName ? agency.agencyName.charAt(0).toUpperCase() : 'A'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                {agency.agencyName}
              </h1>
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
            </div>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem' }}>
              {t(
                'admin.agencyDetail.registeredOn',
                {
                  date: formatDate(agency.createdAt || Date.now(), locale),
                  id: agency.userId,
                },
                `Registered on ${new Date(agency.createdAt || Date.now()).toLocaleDateString()} — User ID #${agency.userId}`,
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isPending && (
            <>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setConfirmActionModal({ type: 'approve' })}
              >
                <FiCheckCircle size={16} /> {t('admin.agencies.approve', 'Approve Agency')}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setConfirmActionModal({ type: 'reject', reason: '' })}
              >
                <FiXCircle size={16} /> {t('admin.agencies.reject', 'Reject Agency')}
              </button>
            </>
          )}

          {isApproved && (
            <button
              type="button"
              className="admin-btn admin-btn-accent"
              onClick={() => setConfirmActionModal({ type: 'suspend', reason: '' })}
            >
              <FiAlertTriangle size={16} /> {t('admin.agencies.suspend', 'Suspend Agency')}
            </button>
          )}

          {isSuspended && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setConfirmActionModal({ type: 'reactivate' })}
            >
              <FiCheckCircle size={16} /> {t('admin.agencies.reactivate', 'Reactivate Agency')}
            </button>
          )}
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

      {/* Two Column Grid: Profile Overview & Document Verification */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Profile Overview Card */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              {t('admin.agencyDetail.contactInfo', 'Profile Overview')}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              rowGap: '1rem',
              columnGap: '0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencyDetail.contactPerson', 'Contact Person')}:
            </span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{agency.contactPerson || '—'}</span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencyDetail.email', 'Business Email')}:
            </span>
            <span style={{ color: '#0F172A' }}>
              {agency.businessEmail || agency.user?.email || '—'}
            </span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencyDetail.phone', 'Phone')}:
            </span>
            <span style={{ color: '#0F172A' }}>{agency.phone || '—'}</span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencies.colLocation', 'Location')}:
            </span>
            <span style={{ color: '#0F172A' }}>
              {[agency.address, agency.city, agency.country].filter(Boolean).join(', ') || '—'}
            </span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencyDetail.website', 'Website')}:
            </span>
            <span>
              {agency.website ? (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0C4E28', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {agency.website} <FiExternalLink size={12} />
                </a>
              ) : (
                '—'
              )}
            </span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {t('admin.agencyDetail.bio', 'Description')}:
            </span>
            <span style={{ color: '#334155', lineHeight: 1.5 }}>{agency.description || '—'}</span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>Agreement:</span>
            <span>
              {agency.agreementAccepted ? (
                <span
                  style={{
                    background: '#DCFCE7',
                    color: '#15803D',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  Accepted ({agency.agreementVersion || 'v1'})
                </span>
              ) : (
                <span
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  Not Accepted
                </span>
              )}
            </span>

            <span style={{ color: '#64748B', fontWeight: 600 }}>Coverage Areas:</span>
            <div>
              {!agency.coverages || agency.coverages.length === 0 ? (
                <span style={{ color: '#DC2626', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No operating areas configured
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {agency.coverages.map((c) => (
                    <span
                      key={c.id || c.locationName}
                      style={{
                        padding: '3px 8px',
                        background: '#E0F2FE',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0369A1',
                      }}
                    >
                      📍 {c.locationName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span style={{ color: '#64748B', fontWeight: 600 }}>Services Offered:</span>
            <div>
              {!agency.capabilities || agency.capabilities.length === 0 ? (
                <span style={{ color: '#DC2626', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No services configured
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {agency.capabilities.map((cap) => (
                    <span
                      key={cap.id || cap.serviceType}
                      style={{
                        padding: '3px 8px',
                        background: '#E5F2EA',
                        border: '1px solid #BBF7D0',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0C4E28',
                      }}
                    >
                      ✓ {cap.serviceType.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Verification Card */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              {t('admin.agencyDetail.documentsTab', { count: agency.documents?.length || 0 }, 'Document Verification')}
            </h2>
          </div>

          {!agency.documents || agency.documents.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <FiFileText size={32} style={{ color: '#94A3B8', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {t('admin.agencyDetail.noDocuments', 'No compliance documents uploaded yet.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agency.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>
                      {doc.documentType?.toUpperCase()}
                    </strong>
                    <StatusBadge status={doc.status} label={t('status.' + doc.status, doc.status)} />
                  </div>

                  <div style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    File: {doc.originalName || doc.filePath}
                  </div>

                  {doc.verificationNote && (
                    <div
                      style={{
                        color: '#DC2626',
                        fontSize: '0.8rem',
                        marginBottom: '0.5rem',
                        background: '#FEE2E2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Admin Note: {doc.verificationNote}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    {doc.status !== 'approved' && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => handleVerifyDocument(doc.id)}
                        disabled={actionLoading}
                      >
                        <FiCheck size={12} /> {t('admin.agencyDetail.verifyDocument', 'Verify Document')}
                      </button>
                    )}
                    {doc.status !== 'rejected' && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => setRejectDocModal({ doc, note: '' })}
                        disabled={actionLoading}
                      >
                        <FiX size={12} /> {t('admin.agencyDetail.rejectDocument', 'Reject Document')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agency Memberships Section */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              {t('admin.agencyDetail.membershipsTab', { count: agency.memberships?.length || 0 }, 'Agency Memberships')}
            </h2>
            <p style={{ color: '#64748B', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              {t(
                'admin.memberships.subtitle',
                'Historical and active subscription tiers assigned to this agency profile.',
              )}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setCreateMemModal(true)}
          >
            <FiPlus size={16} /> {t('admin.agencyDetail.assignMembership', 'Assign Membership Plan')}
          </button>
        </div>

        {!agency.memberships || agency.memberships.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
            <FiCreditCard size={32} style={{ color: '#94A3B8', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {t('admin.memberships.empty', 'No membership records found matching current criteria.')}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.memberships.colPlan', 'Plan')}</th>
                  <th>{t('admin.memberships.colDates', 'Validity Period')}</th>
                  <th>{t('admin.memberships.colStatus', 'Status')}</th>
                  <th>{t('admin.memberships.colPaymentRef', 'Payment Ref')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin.agencies.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {agency.memberships.map((mem) => (
                  <tr key={mem.id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      {mem.plan?.name || `Plan #${mem.planId}`}
                    </td>
                    <td>
                      {formatDate(mem.startsAt, locale)} —{' '}
                      {mem.endsAt ? formatDate(mem.endsAt, locale) : 'Indefinite'}
                    </td>
                    <td>
                      <StatusBadge status={mem.status} label={t('status.' + mem.status, mem.status)} />
                    </td>
                    <td style={{ color: '#64748B' }}>{mem.paymentReference || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/memberships`}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        {t('admin.common.manage', 'Manage')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Approve / Reject / Suspend / Reactivate Confirmation */}
      {confirmActionModal && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmActionModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiShield style={{ color: '#0C4E28' }} />
                {t(
                  'admin.agencies.confirmModalTitle',
                  { type: confirmActionModal.type.charAt(0).toUpperCase() + confirmActionModal.type.slice(1) },
                  `Confirm ${confirmActionModal.type}`,
                )}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setConfirmActionModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                {t(
                  'admin.agencies.confirmModalMsg',
                  { type: confirmActionModal.type, name: agency.agencyName },
                  `Are you sure you want to ${confirmActionModal.type} the agency ${agency.agencyName}?`,
                )}
              </p>

              {['reject', 'suspend'].includes(confirmActionModal.type) && (
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    {t('admin.agencies.reasonLabel', 'Reason / Administrative Note (Optional):')}
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={3}
                    placeholder={t('admin.agencies.reasonPlaceholder', 'Enter reason for this action...')}
                    value={confirmActionModal.reason || ''}
                    onChange={(e) =>
                      setConfirmActionModal({ ...confirmActionModal, reason: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setConfirmActionModal(null)}
                disabled={actionLoading}
              >
                {t('admin.common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className={`admin-btn ${
                  confirmActionModal.type === 'approve' || confirmActionModal.type === 'reactivate'
                    ? 'admin-btn-primary'
                    : 'admin-btn-danger'
                }`}
                onClick={handleActionConfirm}
                disabled={actionLoading}
              >
                {actionLoading
                  ? t('admin.agencies.processing', 'Processing...')
                  : t(
                      'admin.agencies.confirmModalTitle',
                      { type: confirmActionModal.type.charAt(0).toUpperCase() + confirmActionModal.type.slice(1) },
                      `Confirm ${confirmActionModal.type}`,
                    )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reject Document Modal */}
      {rejectDocModal && (
        <div className="admin-modal-backdrop" onClick={() => setRejectDocModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title" style={{ color: '#DC2626' }}>
                <FiXCircle /> {t('admin.agencyDetail.rejectDocTitle', 'Reject Compliance Document')}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setRejectDocModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectDocumentConfirm}>
              <div className="admin-modal-body">
                <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#334155' }}>
                  {t('admin.agencyDetail.rejectDocDesc', 'Provide an administrative note explaining why this document does not meet compliance standards:')}
                </p>
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    {t('admin.agencies.reasonLabel', 'Reason / Administrative Note (Optional):')} <span className="required-star">*</span>
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={3}
                    placeholder={t('admin.agencyDetail.rejectDocNotePlaceholder', 'Explain required corrections or missing details...')}
                    value={rejectDocModal.note}
                    onChange={(e) => setRejectDocModal({ ...rejectDocModal, note: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setRejectDocModal(null)}
                  disabled={actionLoading}
                >
                  {t('admin.common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('admin.agencies.processing', 'Processing...') : t('admin.agencyDetail.rejectDocument', 'Reject Document')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Membership Plan Modal */}
      {createMemModal && (
        <div className="admin-modal-backdrop" onClick={() => setCreateMemModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiCreditCard style={{ color: '#0C4E28' }} />
                {t('admin.agencyDetail.assignMembership', 'Assign Membership Plan')}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setCreateMemModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMembership}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    {t('admin.agencyDetail.planSelectLabel', 'Select Plan')} <span className="required-star">*</span>
                  </label>
                  <select
                    className="admin-form-select"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price} ({p.durationDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.agencyDetail.paymentRefLabel', 'Payment Reference / Receipt ID')}</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Bank Transfer Ref / Invoice #1024"
                    value={memReference}
                    onChange={(e) => setMemReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setCreateMemModal(false)}
                  disabled={actionLoading}
                >
                  {t('admin.common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('admin.agencies.processing', 'Processing...') : t('admin.agencyDetail.assignBtn', 'Assign Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgencyDetailPage;
