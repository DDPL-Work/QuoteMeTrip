import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCreditCard,
  FiSend,
  FiBriefcase,
  FiDollarSign,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { adminApi } from '../services/api.js';
import { useI18n } from '@troublefree/i18n';

export function DashboardPage() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getDashboardMetrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to connect to backend.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div
        className="admin-dashboard-page"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div className="admin-card">
          <div
            className="admin-skeleton"
            style={{ height: '28px', width: '240px', marginBottom: '8px' }}
          />
          <div className="admin-skeleton" style={{ height: '16px', width: '380px' }} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-stat-card">
              <div
                className="admin-skeleton"
                style={{ width: '48px', height: '48px', borderRadius: '0.75rem' }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="admin-skeleton"
                  style={{ height: '24px', width: '60px', marginBottom: '6px' }}
                />
                <div className="admin-skeleton" style={{ height: '14px', width: '100px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <FiAlertCircle style={{ fontSize: '2.5rem', color: '#EF4444', marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1F2937' }}>
          {t('admin.dashboard.errorLoading', 'Unable to load dashboard metrics.')}
        </h2>
        <p style={{ color: '#6B7280', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>{error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={fetchMetrics}>
          <FiRefreshCw /> {t('admin.dashboard.retry', 'Retry Connection')}
        </button>
      </div>
    );
  }

  const { agencies, memberships, marketplace, commissions } = metrics || {};

  return (
    <div
      className="admin-dashboard-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Hero Welcome Header */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)',
          color: '#FFFFFF',
          border: 'none',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
          {t('admin.dashboard.greeting', 'Good afternoon, Admin')}
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '600px' }}>
          {t(
            'admin.dashboard.subtitle',
            'Monitor agencies, requests, memberships and platform operations across the QuoteMeTrip marketplace.',
          )}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Agencies Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUsers />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-stat-value">{agencies?.total || 0}</div>
              <Link
                to="/agencies"
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                {t('admin.common.view', 'View')} <FiArrowRight />
              </Link>
            </div>
            <div className="admin-stat-label">
              {t('admin.dashboard.totalAgencies', 'Total Agencies')}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <span className="admin-badge admin-badge-warning">
                {t(
                  'admin.dashboard.pending',
                  { count: agencies?.pending || 0 },
                  `Pending: ${agencies?.pending || 0}`,
                )}
              </span>
              <span className="admin-badge admin-badge-success">
                {t(
                  'admin.dashboard.approved',
                  { count: agencies?.approved || 0 },
                  `Approved: ${agencies?.approved || 0}`,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Memberships Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#E0F2FE', color: '#0369A1' }}>
            <FiCreditCard />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-stat-value">{memberships?.active || 0}</div>
              <Link
                to="/memberships"
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                {t('admin.common.manage', 'Manage')} <FiArrowRight />
              </Link>
            </div>
            <div className="admin-stat-label">
              {t('admin.dashboard.activeMemberships', 'Active Memberships')}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <span className="admin-badge admin-badge-warning">
                {t(
                  'admin.dashboard.pending',
                  { count: memberships?.pending || 0 },
                  `Pending: ${memberships?.pending || 0}`,
                )}
              </span>
              <span className="admin-badge admin-badge-info">
                {t(
                  'admin.dashboard.expired',
                  { count: memberships?.expired || 0 },
                  `Expired: ${memberships?.expired || 0}`,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Requests & Jobs Volume */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <FiSend />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-stat-value">{marketplace?.totalRequests || 0}</div>
              <Link
                to="/travel-requests"
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                {t('admin.common.requests', 'Requests')} <FiArrowRight />
              </Link>
            </div>
            <div className="admin-stat-label">
              {t('admin.dashboard.travelRequests', 'Travel Requests')}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <span className="admin-badge admin-badge-info">
                {t(
                  'admin.dashboard.activeJobs',
                  { count: marketplace?.activeJobs || 0 },
                  `Active Jobs: ${marketplace?.activeJobs || 0}`,
                )}
              </span>
              <span className="admin-badge admin-badge-success">
                {t(
                  'admin.dashboard.completed',
                  { count: marketplace?.completedJobs || 0 },
                  `Completed: ${marketplace?.completedJobs || 0}`,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Commissions Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <FiDollarSign />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-stat-value" style={{ color: 'var(--admin-secondary)' }}>
                ${commissions?.totalCommissionAmount ?? '0.00'}
              </div>
              <Link
                to="/commissions"
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                {t('admin.common.details', 'Details')} <FiArrowRight />
              </Link>
            </div>
            <div className="admin-stat-label">
              {t('admin.dashboard.totalCommissions', 'Total Commissions')}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <span className="admin-badge admin-badge-warning">
                {t(
                  'admin.dashboard.pendingCommission',
                  { amount: commissions?.pendingAmount ?? '0.00' },
                  `Pending: $${commissions?.pendingAmount ?? '0.00'}`,
                )}
              </span>
              <span className="admin-badge admin-badge-success">
                {t(
                  'admin.dashboard.paid',
                  { amount: commissions?.paidAmount ?? '0.00' },
                  `Paid: $${commissions?.paidAmount ?? '0.00'}`,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Attention Needed Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            {t('admin.dashboard.attentionNeeded', 'Operational Attention Needed')}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {agencies?.pending > 0 ? (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: '#FEF3C7',
                borderLeft: '4px solid #B45309',
                borderRadius: 'var(--admin-radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E' }}
              >
                <FiAlertCircle />
                <span>
                  {t(
                    'admin.dashboard.agencyAlert',
                    { count: agencies.pending },
                    `${agencies.pending} agency registrations waiting for document verification and approval.`,
                  )}
                </span>
              </div>
              <Link
                to="/agencies?status=pending"
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                {t('admin.dashboard.reviewAgencies', 'Review Agencies')}
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--admin-text-muted)',
                fontSize: '0.9rem',
              }}
            >
              <FiCheckCircle style={{ color: '#16A34A' }} />{' '}
              {t('admin.dashboard.allAgenciesReviewed', 'All agency applications have been reviewed.')}
            </div>
          )}

          {memberships?.pending > 0 ? (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: '#E0F2FE',
                borderLeft: '4px solid #0284C7',
                borderRadius: 'var(--admin-radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#075985' }}
              >
                <FiAlertCircle />
                <span>
                  {t(
                    'admin.dashboard.membershipAlert',
                    { count: memberships.pending },
                    `${memberships.pending} membership payments pending manual admin confirmation.`,
                  )}
                </span>
              </div>
              <Link
                to="/memberships?status=pending"
                className="admin-btn admin-btn-accent admin-btn-sm"
              >
                {t('admin.dashboard.confirmPayments', 'Confirm Payments')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
