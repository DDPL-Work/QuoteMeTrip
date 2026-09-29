import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function AdminJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    adminApi
      .listJobs({ status, page, pageSize: 15 })
      .then((data) => {
        if (isMounted) {
          setJobs(data.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [status, page]);

  return (
    <div
      className="admin-jobs-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
          Marketplace Jobs (Operational Visibility)
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          Read-only operational monitoring of accepted marketplace bookings.
        </p>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <select
          value={status}
          onChange={(e) => setSearchParams({ status: e.target.value, page: '1' })}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}
        >
          <option value="">All Job Statuses</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div>Loading jobs...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : jobs.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          No jobs found matching the selected filter.
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
                <th style={{ padding: '0.75rem 1rem' }}>Job ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Agency</th>
                <th style={{ padding: '0.75rem 1rem' }}>Traveller</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quotation Total</th>
                <th style={{ padding: '0.75rem 1rem' }}>Accepted Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{j.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{j.agency?.agencyName || `Agency #${j.agencyId}`}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      {j.agency?.businessEmail}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{j.traveller?.name || 'Traveller'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      {j.traveller?.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2E9E5B' }}>
                    ${j.quotation?.priceTotal || '0.00'} {j.quotation?.currency}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {j.acceptedAt ? new Date(j.acceptedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={j.status} />
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
