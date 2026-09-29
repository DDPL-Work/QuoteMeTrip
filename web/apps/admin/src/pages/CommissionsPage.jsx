import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function CommissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.listCommissions({ status, page, pageSize: 15 }),
      adminApi.getCommissionSummary(),
    ])
      .then(([listData, summaryData]) => {
        setCommissions(listData.items || []);
        setSummary(summaryData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [status, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusFilter = (val) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val) p.set('status', val);
      else p.delete('status');
      p.set('page', '1');
      return p;
    });
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      await adminApi.updateCommissionStatus(id, { status: nextStatus });
      loadData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div
      className="admin-commissions-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>Commission Tracking</h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          Track platform commission earnings from accepted marketplace jobs.
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Earned</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2E9E5B' }}>
              ${summary.totalCommissionAmount}
            </div>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D69E2E' }}>
              ${summary.pendingAmount}
            </div>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>Confirmed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3182CE' }}>
              ${summary.confirmedAmount}
            </div>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>Paid Out</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38A169' }}>
              ${summary.paidAmount}
            </div>
          </div>
        </div>
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
          <option value="">All Commission Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>Loading commissions...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : commissions.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          No commission records found.
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
                <th style={{ padding: '0.75rem 1rem' }}>Commission ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Agency</th>
                <th style={{ padding: '0.75rem 1rem' }}>Job / Quotation</th>
                <th style={{ padding: '0.75rem 1rem' }}>Basis (Job Amount)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Commission</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((comm) => (
                <tr key={comm.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{comm.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {comm.agency?.agencyName || `Agency #${comm.agencyId}`}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    Job #{comm.jobId} (Q #{comm.quotationId})
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    ${comm.jobAmount} {comm.currency}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{comm.commissionRate}%</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2E9E5B' }}>
                    ${comm.commissionAmount}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={comm.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      {comm.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(comm.id, 'confirmed')}
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
                          Confirm
                        </button>
                      )}
                      {(comm.status === 'pending' || comm.status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(comm.id, 'paid')}
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
                          Mark Paid
                        </button>
                      )}
                      {comm.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(comm.id, 'cancelled')}
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
                          Cancel
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
    </div>
  );
}
