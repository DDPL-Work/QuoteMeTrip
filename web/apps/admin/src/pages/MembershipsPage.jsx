import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useI18n, formatDate } from '@troublefree/i18n';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { AlertBanner } from '../components/AlertBanner.jsx';

export function MembershipsPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, action, variant }
  const [actionLoading, setActionLoading] = useState(false);

  const [paymentModal, setPaymentModal] = useState(null); // { membership, paymentReference, notes }

  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';

  const loadMemberships = useCallback(() => {
    setLoading(true);
    adminApi
      .listMemberships({ status, page, pageSize: 15 })
      .then((data) => {
        setMemberships(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [status, page]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const handleStatusFilter = (val) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val) p.set('status', val);
      else p.delete('status');
      p.set('page', '1');
      return p;
    });
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    setFeedback(null);
    try {
      await adminApi.confirmPayment(paymentModal.membership.id, {
        paymentReference: paymentModal.paymentReference,
        notes: paymentModal.notes,
      });
      setFeedback({ type: 'success', message: t('admin.memberships.paymentSuccess') });
      setPaymentModal(null);
      loadMemberships();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const promptSuspend = (memId) => {
    setConfirmDialog({
      title: t('admin.memberships.suspendTitle'),
      message: t('admin.memberships.suspendMessage'),
      confirmText: t('admin.memberships.suspendConfirmText'),
      variant: 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await adminApi.suspendMembership(memId);
          setFeedback({ type: 'success', message: t('admin.memberships.suspendSuccess') });
          setConfirmDialog(null);
          loadMemberships();
        } catch (err) {
          setFeedback({ type: 'error', message: err.message });
          setConfirmDialog(null);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const promptReactivate = (memId) => {
    setConfirmDialog({
      title: t('admin.memberships.reactivateTitle'),
      message: t('admin.memberships.reactivateMessage'),
      confirmText: t('admin.memberships.reactivateConfirmText'),
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          await adminApi.reactivateMembership(memId);
          setFeedback({ type: 'success', message: t('admin.memberships.reactivateSuccess') });
          setConfirmDialog(null);
          loadMemberships();
        } catch (err) {
          setFeedback({ type: 'error', message: err.message });
          setConfirmDialog(null);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div
      className="admin-memberships-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
          {t('admin.memberships.title')}
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          {t('admin.memberships.subtitle')}
        </p>
      </div>

      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          background: '#FFFFFF',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <select
          value={status}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}
        >
          <option value="">{t('admin.common.allStatuses')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="expired">{t('status.expired')}</option>
          <option value="suspended">{t('status.suspended')}</option>
          <option value="cancelled">{t('status.cancelled')}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>{t('admin.memberships.loading')}</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>{t('admin.common.error')}: {error}</div>
      ) : memberships.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          {t('admin.memberships.empty')}
        </div>
      ) : (
        <div
          className="admin-table-container"
          style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            overflowX: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxWidth: '100%',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ background: '#EDF2F7', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colAgency')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colPlan')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colDates')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colStatus')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colPaymentRef')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.memberships.colConfirmedBy', 'Confirmed By')}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((mem) => (
                <tr key={mem.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    <Link
                      to={`/agencies/${mem.agencyId}`}
                      style={{ color: '#2E9E5B', textDecoration: 'none' }}
                    >
                      {mem.agency?.agencyName || `Agency #${mem.agencyId}`}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {mem.plan?.name || `Plan #${mem.planId}`}
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>${mem.plan?.price}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {formatDate(mem.startsAt)} —{' '}
                    {mem.endsAt ? formatDate(mem.endsAt) : 'Indefinite'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={mem.status} label={t(`status.${mem.status}`, mem.status)} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{mem.paymentReference || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{mem.confirmer?.email || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {mem.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentModal({ membership: mem, paymentReference: '', notes: '' })
                          }
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#2E9E5B',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {t('admin.memberships.confirmPaymentBtn')}
                        </button>
                      )}
                      {mem.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => promptSuspend(mem.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#DD6B20',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {t('admin.memberships.suspendBtn')}
                        </button>
                      )}
                      {mem.status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => promptReactivate(mem.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#3182CE',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {t('admin.memberships.reactivateBtn')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleConfirmPayment}
            style={{
              background: '#FFF',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('admin.memberships.confirmPaymentTitle')}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4A5568' }}>
              {t('admin.memberships.confirmPaymentDesc', {
                agency: paymentModal.membership.agency?.agencyName || `Agency #${paymentModal.membership.agencyId}`,
                plan: paymentModal.membership.plan?.name || '',
              })}
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {t('admin.memberships.paymentRefLabel')}
              </label>
              <input
                type="text"
                required
                placeholder={t('admin.memberships.paymentRefPlaceholder')}
                value={paymentModal.paymentReference}
                onChange={(e) =>
                  setPaymentModal({ ...paymentModal, paymentReference: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {t('admin.memberships.adminNotesLabel')}
              </label>
              <textarea
                placeholder={t('admin.memberships.adminNotesPlaceholder')}
                value={paymentModal.notes}
                onChange={(e) => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setPaymentModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                  background: '#FFF',
                }}
              >
                {t('admin.common.cancel')}
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#2E9E5B',
                  color: '#FFF',
                  cursor: 'pointer',
                }}
              >
                {t('admin.memberships.confirmPaymentBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal
          isOpen={Boolean(confirmDialog)}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={t('admin.common.cancel')}
          variant={confirmDialog.variant || 'warning'}
          loading={actionLoading}
          onConfirm={confirmDialog.action}
          onCancel={() => !actionLoading && setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
