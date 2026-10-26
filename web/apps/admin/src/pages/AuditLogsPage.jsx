import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n, formatDate } from '@troublefree/i18n';
import { adminApi } from '../services/api.js';

export function AuditLogsPage() {
  const { t, locale } = useI18n();
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
          {t('admin.auditLogs.title')}
        </h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>
          {t('admin.auditLogs.subtitle')}
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
          placeholder={t('admin.auditLogs.filterAction')}
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
          <option value="">{t('admin.auditLogs.allEntities')}</option>
          <option value="agency">{t('admin.auditLogs.entityAgency')}</option>
          <option value="document">{t('admin.auditLogs.entityDocument')}</option>
          <option value="membership">{t('admin.auditLogs.entityMembership')}</option>
          <option value="commission">{t('admin.auditLogs.entityCommission')}</option>
          <option value="membership_plan">{t('admin.auditLogs.entityMembershipPlan')}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>{t('admin.auditLogs.loadingLogs')}</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>{t('admin.common.error')}: {error}</div>
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
          {t('admin.auditLogs.noLogs')}
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
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.auditLogs.colTimestamp')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.auditLogs.colActor')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.auditLogs.colAction')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.auditLogs.colTargetEntity')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin.auditLogs.colIpAddress')}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('admin.auditLogs.colStateDiff')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    {log.createdAt || log.created_at
                      ? new Date(log.createdAt || log.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')
                      : '—'}
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
                      <span style={{ color: '#718096' }}>{t('admin.auditLogs.systemPublic')}</span>
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
                      {t('admin.auditLogs.inspectJson')}
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
              {t('admin.auditLogs.modalTitle')} #{inspectModal.id} ({inspectModal.action})
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#718096', fontSize: '0.875rem' }}>
                {t('admin.auditLogs.beforeState')}
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
                {t('admin.auditLogs.afterState')}
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
                {t('admin.common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
