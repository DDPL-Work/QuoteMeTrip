import React from 'react';
import { StatusBadge } from '@troublefree/ui';
import { QUOTATION_TYPE_LABELS } from '@troublefree/types';
import {
  FiCalendar,
  FiDollarSign,
  FiTag,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

export function QuotationSummary({ quotation }) {
  if (!quotation) return null;

  const items = quotation.items || [];
  const inclusions = Array.isArray(quotation.inclusions) ? quotation.inclusions : [];
  const exclusions = Array.isArray(quotation.exclusions) ? quotation.exclusions : [];

  const formattedTotal = quotation.totalAmount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: quotation.currency || 'USD',
      }).format(quotation.totalAmount)
    : `${quotation.currency || '$'}${quotation.totalAmount || 0}`;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
              Quotation #{quotation.id}
            </h2>
            <StatusBadge status={quotation.status} label={`(${quotation.status})`} />
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Type:{' '}
            {QUOTATION_TYPE_LABELS[quotation.quotationType] ||
              quotation.quotationType ||
              'Standard'}
            {quotation.validUntil && (
              <span style={{ marginLeft: '16px' }}>
                <FiCalendar style={{ marginRight: '4px' }} /> Valid until:{' '}
                {new Date(quotation.validUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '0.85rem',
              color: '#64748b',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Total Price
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0c4e28' }}>
            {formattedTotal}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiTag /> Service Items
        </h3>

        {items.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
            No line items included.
          </p>
        ) : (
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
                <th style={{ padding: '10px 12px' }}>Item</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                    {item.title || item.description || `Item #${idx + 1}`}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.category || item.itemType || 'General Service'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#334155' }}>
                    {item.quantity || 1}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#334155' }}>
                    {quotation.currency} {Number(item.unitPrice || 0).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#0c4e28',
                    }}
                  >
                    {quotation.currency}{' '}
                    {Number(
                      item.totalPrice || (item.quantity || 1) * (item.unitPrice || 0),
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inclusions & Exclusions */}
      {(inclusions.length > 0 || exclusions.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {inclusions.length > 0 && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 10px 0',
                  color: '#166534',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiCheckCircle /> Inclusions
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '0.9rem' }}>
                {inclusions.map((inc, i) => (
                  <li key={i}>{inc}</li>
                ))}
              </ul>
            </div>
          )}

          {exclusions.length > 0 && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 10px 0',
                  color: '#991b1b',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiXCircle /> Exclusions
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '0.9rem' }}>
                {exclusions.map((exc, i) => (
                  <li key={i}>{exc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Notes & Terms */}
      {quotation.notes && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h4
            style={{
              margin: '0 0 6px 0',
              fontSize: '0.9rem',
              color: '#334155',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiFileText /> Terms & Notes
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
            {quotation.notes}
          </p>
        </div>
      )}
    </div>
  );
}
