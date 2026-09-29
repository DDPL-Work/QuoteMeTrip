import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';

export function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspectModal, setInspectModal] = useState(null);

  const action = searchParams.get('action') || '';
  const entityType = searchParams.get('entityType') || '';
  const page = searchParams.get('page') || '1';

  const loadLogs = useCallback(() => {
    setLoading(true);
    adminApi
      .listAuditLogs({ action, entityType, page, pageSize: 20 })
      .then((data) => {
        setLogs(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [action, entityType, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div
      className="admin-audit-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>
          Administrative Audit Logs
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          Immutable compliance record of admin state changes, approvals, and overrides.
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
        <input
          type="text"
          placeholder="Filter by action (e.g. agency.approved)..."
          value={action}
          onChange={(e) => setSearchParams({ action: e.target.value, entityType, page: '1' })}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid #CBD5E0',
          }}
        />
        <select
          value={entityType}
          onChange={(e) => setSearchParams({ action, entityType: e.target.value, page: '1' })}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}
        >
          <option value="">All Entity Types</option>
          <option value="agency">Agency</option>
          <option value="document">Document</option>
          <option value="membership">Membership</option>
          <option value="commission">Commission</option>
          <option value="membership_plan">Membership Plan</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>Loading audit logs...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : logs.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '2rem',
            textAlign: 'center',
            color: '#718096',
            borderRadius: '8px',
          }}
        >
          No audit log entries found.
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
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem' }}>Target Entity</th>
                <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>State Diff</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {log.actor ? (
                      <div>
                        <strong>{log.actor.name || log.actor.email}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          ID #{log.actor.id}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#718096' }}>System / Public</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <code
                      style={{
                        background: '#EDF2F7',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        color: '#2D3748',
                      }}
                    >
                      {log.action}
                    </code>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {log.entityType} #{log.entityId}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#718096' }}>
                    {log.ipAddress || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setInspectModal(log)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#EDF2F7',
                        border: '1px solid #CBD5E0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Diff Inspector Modal */}
      {inspectModal && (
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Audit Entry #{inspectModal.id} ({inspectModal.action})
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#718096', fontSize: '0.875rem' }}>
                Before State:
              </h4>
              <pre
                style={{
                  background: '#F7FAFC',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(inspectModal.beforeState, null, 2) || 'null'}
              </pre>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2E9E5B', fontSize: '0.875rem' }}>
                After State:
              </h4>
              <pre
                style={{
                  background: '#F7FAFC',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(inspectModal.afterState, null, 2) || 'null'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                  background: '#FFF',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
