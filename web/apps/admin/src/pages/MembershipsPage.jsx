import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function MembershipsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    try {
      await adminApi.confirmPayment(paymentModal.membership.id, {
        paymentReference: paymentModal.paymentReference,
        notes: paymentModal.notes,
      });
      setPaymentModal(null);
      loadMemberships();
    } catch (err) {
      alert(`Payment confirmation failed: ${err.message}`);
    }
  };

  const handleSuspend = async (memId) => {
    if (!window.confirm('Suspend this agency membership?')) return;
    try {
      await adminApi.suspendMembership(memId);
      loadMemberships();
    } catch (err) {
      alert(`Suspension failed: ${err.message}`);
    }
  };

  const handleReactivate = async (memId) => {
    if (!window.confirm('Reactivate this agency membership?')) return;
    try {
      await adminApi.reactivateMembership(memId);
      loadMemberships();
    } catch (err) {
      alert(`Reactivation failed: ${err.message}`);
    }
  };

  return (
    <div
      className="admin-memberships-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
          Agency Membership Lifecycle & Payments
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          Manage agency subscriptions, manual payment verification, and active windows.
        </p>
      </div>

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
          <option value="">All Statuses</option>
          <option value="pending">Pending Payment</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>Loading memberships...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
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
          No membership records found.
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                <th style={{ padding: '0.75rem 1rem' }}>Agency</th>
                <th style={{ padding: '0.75rem 1rem' }}>Plan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Period</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Payment Ref</th>
                <th style={{ padding: '0.75rem 1rem' }}>Confirmed By</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
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
                    {new Date(mem.startsAt).toLocaleDateString()} —{' '}
                    {mem.endsAt ? new Date(mem.endsAt).toLocaleDateString() : 'Indefinite'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={mem.status} />
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
                          Confirm Payment
                        </button>
                      )}
                      {mem.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(mem.id)}
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
                          Suspend
                        </button>
                      )}
                      {mem.status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleReactivate(mem.id)}
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
                          Reactivate
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
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Confirm Membership Payment</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4A5568' }}>
              Confirm payment for agency{' '}
              <strong>{paymentModal.membership.agency?.agencyName}</strong> (
              {paymentModal.membership.plan?.name}).
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Payment Reference / Txn ID:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bank Wire Ref #998877"
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
                Verification Notes:
              </label>
              <textarea
                placeholder="Optional notes for audit log..."
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
                Cancel
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
                Confirm Payment & Activate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
