import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, Spinner } from '@troublefree/ui';
import { QUOTATION_TYPE_LABELS } from '@troublefree/types';
import { FiEye, FiEdit2, FiXCircle, FiCalendar, FiArrowRight } from 'react-icons/fi';

export function AgencyQuotationList({ quotations = [], loading = false, onWithdraw }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <Spinner />
      </div>
    );
  }

  if (!quotations || quotations.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1e293b' }}>
          No Quotations Yet
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Quotations you create for matched travel requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr
            style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              textAlign: 'left',
              color: '#64748b',
            }}
          >
            <th style={{ padding: '12px 16px' }}>Quote #</th>
            <th style={{ padding: '12px 16px' }}>Request Context</th>
            <th style={{ padding: '12px 16px' }}>Type</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
            <th style={{ padding: '12px 16px' }}>Status</th>
            <th style={{ padding: '12px 16px' }}>Validity</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((q) => {
            const formattedTotal = q.totalAmount
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: q.currency || 'USD',
                }).format(q.totalAmount)
              : `${q.currency || '$'}${q.totalAmount || 0}`;

            const isDraft = q.status === 'draft';
            const isSubmitted = q.status === 'submitted';

            return (
              <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td
                  style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--agency-primary)' }}
                >
                  #{q.id}
                </td>
                <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                  Request #{q.travelRequestId || q.requestId || 'N/A'}
                </td>
                <td style={{ padding: '14px 16px', color: '#64748b' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.375rem',
                    }}
                  >
                    {QUOTATION_TYPE_LABELS[q.quotationType] || q.quotationType || 'Standard'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    textAlign: 'right',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#0c4e28',
                  }}
                >
                  {formattedTotal}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <StatusBadge status={q.status} />
                </td>
                <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                  {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : 'Not specified'}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Link
                      to={`/quotations/${q.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        color: '#334155',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <FiEye /> View
                    </Link>

                    {isDraft && (
                      <Link
                        to={`/quotations/${q.id}/edit`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#f0fdf4',
                          color: '#166534',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <FiEdit2 /> Edit
                      </Link>
                    )}

                    {(isDraft || isSubmitted) && onWithdraw && (
                      <button
                        type="button"
                        onClick={() => onWithdraw(q.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <FiXCircle /> Withdraw
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
