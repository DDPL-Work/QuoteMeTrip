import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api.js';

export function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi
      .getDashboardMetrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading dashboard metrics...</div>;
  }

  if (error) {
    return <div className="admin-error">Error loading metrics: {error}</div>;
  }

  const { agencies, memberships, marketplace, commissions } = metrics || {};

  return (
    <div
      className="admin-dashboard-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', marginBottom: '0.25rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#718096' }}>
          Real-time operational summary across the Troublefree Holiday marketplace.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Agencies Card */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#4A5568' }}>Agencies</h3>
            <Link to="/agencies" style={{ fontSize: '0.875rem', color: '#2E9E5B' }}>
              View all →
            </Link>
          </div>
          <div
            style={{ fontSize: '2rem', fontWeight: 700, color: '#23272B', marginBottom: '0.75rem' }}
          >
            {agencies?.total || 0}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span style={{ color: '#D69E2E' }}>
              Pending: <strong>{agencies?.pending || 0}</strong>
            </span>
            <span style={{ color: '#2E9E5B' }}>
              Approved: <strong>{agencies?.approved || 0}</strong>
            </span>
            <span style={{ color: '#E53E3E' }}>
              Suspended: <strong>{agencies?.suspended || 0}</strong>
            </span>
          </div>
        </div>

        {/* Memberships Card */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#4A5568' }}>Memberships</h3>
            <Link to="/memberships" style={{ fontSize: '0.875rem', color: '#2E9E5B' }}>
              Manage →
            </Link>
          </div>
          <div
            style={{ fontSize: '2rem', fontWeight: 700, color: '#23272B', marginBottom: '0.75rem' }}
          >
            {memberships?.active || 0}{' '}
            <small style={{ fontSize: '1rem', fontWeight: 400, color: '#718096' }}>active</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span style={{ color: '#DD6B20' }}>
              Pending Payment: <strong>{memberships?.pending || 0}</strong>
            </span>
            <span style={{ color: '#718096' }}>
              Expired: <strong>{memberships?.expired || 0}</strong>
            </span>
          </div>
        </div>

        {/* Travel Requests & Jobs */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#4A5568' }}>Marketplace Volume</h3>
            <Link to="/jobs" style={{ fontSize: '0.875rem', color: '#2E9E5B' }}>
              Jobs →
            </Link>
          </div>
          <div
            style={{ fontSize: '2rem', fontWeight: 700, color: '#23272B', marginBottom: '0.75rem' }}
          >
            {marketplace?.totalRequests || 0}{' '}
            <small style={{ fontSize: '1rem', fontWeight: 400, color: '#718096' }}>requests</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span>
              Active Jobs: <strong>{marketplace?.activeJobs || 0}</strong>
            </span>
            <span>
              Completed: <strong>{marketplace?.completedJobs || 0}</strong>
            </span>
          </div>
        </div>

        {/* Commissions Summary */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#4A5568' }}>Commissions</h3>
            <Link to="/commissions" style={{ fontSize: '0.875rem', color: '#2E9E5B' }}>
              Details →
            </Link>
          </div>
          <div
            style={{ fontSize: '2rem', fontWeight: 700, color: '#2E9E5B', marginBottom: '0.75rem' }}
          >
            ${commissions?.totalCommissionAmount || '0.00'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span>
              Pending: <strong>${commissions?.pendingAmount || '0.00'}</strong>
            </span>
            <span>
              Paid: <strong>${commissions?.paidAmount || '0.00'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Alerts */}
      <div
        style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#23272B' }}>
          Operational Attention Needed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {agencies?.pending > 0 ? (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FEFCBF',
                borderLeft: '4px solid #D69E2E',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                <strong>{agencies.pending} agency registrations</strong> waiting for document
                verification and approval.
              </span>
              <Link
                to="/agencies?status=pending"
                className="tf-btn tf-btn-sm tf-btn-secondary"
                style={{
                  textDecoration: 'none',
                  padding: '0.4rem 0.8rem',
                  background: '#2E9E5B',
                  color: '#FFF',
                  borderRadius: '4px',
                }}
              >
                Review Agencies
              </Link>
            </div>
          ) : (
            <p style={{ color: '#718096', margin: 0 }}>No pending agency approvals at this time.</p>
          )}

          {memberships?.pending > 0 ? (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#EBF8FF',
                borderLeft: '4px solid #3182CE',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                <strong>{memberships.pending} membership payments</strong> pending manual admin
                confirmation.
              </span>
              <Link
                to="/memberships?status=pending"
                className="tf-btn tf-btn-sm"
                style={{
                  textDecoration: 'none',
                  padding: '0.4rem 0.8rem',
                  background: '#3182CE',
                  color: '#FFF',
                  borderRadius: '4px',
                }}
              >
                Confirm Payments
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
