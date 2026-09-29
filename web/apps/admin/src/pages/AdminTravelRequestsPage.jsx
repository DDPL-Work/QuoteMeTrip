import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function AdminTravelRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    adminApi
      .listTravelRequests({ status, page, pageSize: 15 })
      .then((data) => {
        if (isMounted) {
          setRequests(data.items || []);
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
      className="admin-requests-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
          Travel Requests (Operational Visibility)
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          Read-only operational inspection of traveller itineraries and submitted requests.
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
          <option value="">All Request Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="matching">Matching</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div>Loading travel requests...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : requests.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          No travel requests found.
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
                <th style={{ padding: '0.75rem 1rem' }}>Request ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Traveller</th>
                <th style={{ padding: '0.75rem 1rem' }}>Dates</th>
                <th style={{ padding: '0.75rem 1rem' }}>Party Size</th>
                <th style={{ padding: '0.75rem 1rem' }}>Package</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quotations</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{req.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{req.traveller?.name || 'Traveller'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      {req.traveller?.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {req.travelStartDate ? new Date(req.travelStartDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{req.numberOfTravellers} traveller(s)</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{req.packageType}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {req.quotations?.length || 0} quote(s)
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={req.status} />
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
