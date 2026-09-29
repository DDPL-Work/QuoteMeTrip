import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function AgenciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agencies, setAgencies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type, agency, reason }

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
        setError(err.message);
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
    try {
      if (type === 'approve') await adminApi.approveAgency(agency.id);
      if (type === 'reject') await adminApi.rejectAgency(agency.id, reason);
      if (type === 'suspend') await adminApi.suspendAgency(agency.id, reason);
      if (type === 'reactivate') await adminApi.reactivateAgency(agency.id);

      setActionModal(null);
      loadAgencies();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div
      className="admin-agencies-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
            Agency Directory & Approval
          </h1>
          <p style={{ color: '#718096', marginTop: '0.25rem' }}>
            Manage agency onboardings, document verification, and status controls.
          </p>
        </div>
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
        <input
          type="text"
          placeholder="Search by agency name, email, city, country..."
          value={search}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid #CBD5E0',
          }}
        />
        <select
          value={status}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>Loading agency records...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : agencies.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          No agencies match the selected filters.
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
                <th style={{ padding: '0.75rem 1rem' }}>Contact / Email</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Docs</th>
                <th style={{ padding: '0.75rem 1rem' }}>Memberships</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    <Link
                      to={`/agencies/${agency.id}`}
                      style={{ color: '#2E9E5B', textDecoration: 'none' }}
                    >
                      {agency.agencyName}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>ID #{agency.id}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{agency.contactPerson || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      {agency.businessEmail || agency.user?.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {[agency.city, agency.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={agency.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {agency.documents?.length || 0} doc(s)
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {agency.memberships?.length || 0} record(s)
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/agencies/${agency.id}`}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#EDF2F7',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: '#2D3748',
                          fontSize: '0.75rem',
                        }}
                      >
                        Details
                      </Link>
                      {agency.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionModal({ type: 'approve', agency })}
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
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionModal({ type: 'reject', agency, reason: '' })}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#E53E3E',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {agency.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => setActionModal({ type: 'suspend', agency, reason: '' })}
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
                      {agency.status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => setActionModal({ type: 'reactivate', agency })}
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                borderTop: '1px solid #E2E8F0',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: '#718096' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setSearchParams((p) => {
                      const next = new URLSearchParams(p);
                      next.set('page', String(pagination.page - 1));
                      return next;
                    })
                  }
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                    background: '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setSearchParams((p) => {
                      const next = new URLSearchParams(p);
                      next.set('page', String(pagination.page + 1));
                      return next;
                    })
                  }
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                    background: '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {actionModal && (
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
          <div
            style={{
              background: '#FFF',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '100%',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm {actionModal.type} Agency</h3>
            <p>
              Are you sure you want to <strong>{actionModal.type}</strong> agency{' '}
              <strong>{actionModal.agency?.agencyName}</strong>?
            </p>
            {['reject', 'suspend'].includes(actionModal.type) && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Reason / Note (optional):
                </label>
                <textarea
                  value={actionModal.reason || ''}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActionModal(null)}
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
                type="button"
                onClick={handleAction}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  color: '#FFF',
                  background:
                    actionModal.type === 'approve'
                      ? '#2E9E5B'
                      : actionModal.type === 'reject'
                        ? '#E53E3E'
                        : actionModal.type === 'suspend'
                          ? '#DD6B20'
                          : '#3182CE',
                  cursor: 'pointer',
                }}
              >
                Confirm {actionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
