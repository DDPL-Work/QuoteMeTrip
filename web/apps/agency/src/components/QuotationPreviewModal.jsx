import React from 'react';
import { Modal, Button, StatusBadge } from '@troublefree/ui';
import { QUOTATION_TYPE_LABELS } from '@troublefree/types';
import { FiCalendar, FiCheckCircle, FiXCircle, FiTag, FiFileText, FiShield } from 'react-icons/fi';

export function QuotationPreviewModal({ isOpen, onClose, formData = {}, travelRequest = {} }) {
  if (!isOpen) return null;

  const items = formData.items || [];
  const inclusions = Array.isArray(formData.inclusions) ? formData.inclusions : [];
  const exclusions = Array.isArray(formData.exclusions) ? formData.exclusions : [];

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0,
  );

  const formattedTotal = subtotal
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: formData.currency || 'USD',
      }).format(subtotal)
    : `${formData.currency || '$'}${subtotal}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quotation Offer Preview">
      <div style={{ padding: '8px 0', fontFamily: 'system-ui, sans-serif' }}>
        {/* PDF Document Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0c4e28 0%, #147d33 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.9,
              }}
            >
              Official Travel Proposal
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
              {QUOTATION_TYPE_LABELS[formData.quotationType] ||
                formData.quotationType ||
                'Travel Package Proposal'}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              DRAFT PREVIEW
            </span>
          </div>
        </div>

        {/* Travel Request Context */}
        {travelRequest?.id && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#475569',
            }}
          >
            <strong>Travel Request #{travelRequest.id}</strong> —{' '}
            {travelRequest.numberOfTravellers || 1} Travellers
            {travelRequest.travelStartDate && (
              <span style={{ marginLeft: '12px' }}>
                ({new Date(travelRequest.travelStartDate).toLocaleDateString()} –{' '}
                {travelRequest.travelEndDate
                  ? new Date(travelRequest.travelEndDate).toLocaleDateString()
                  : ''}
                )
              </span>
            )}
          </div>
        )}

        {/* Itemized Breakdown Table */}
        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiTag /> Itemized Service Breakdown
          </h4>

          {items.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
              No items added yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    background: '#f1f5f9',
                    borderBottom: '1px solid #cbd5e1',
                    textAlign: 'left',
                    color: '#475569',
                  }}
                >
                  <th style={{ padding: '8px 10px' }}>Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1e293b' }}>
                        {item.title || item.description || `Service #${idx + 1}`}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                        {item.quantity || 1}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                        {formData.currency} {item.unitPrice || 0}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {formData.currency} {lineTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pricing Summary */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                color: '#166534',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Total Offer Amount
            </span>
            {formData.validUntil && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#15803d',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiCalendar size={12} /> Valid until:{' '}
                {new Date(formData.validUntil).toLocaleDateString()}
              </div>
            )}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0c4e28' }}>
            {formattedTotal}
          </div>
        </div>

        {/* Inclusions / Exclusions */}
        {(inclusions.length > 0 || exclusions.length > 0) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            {inclusions.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '12px',
                }}
              >
                <strong style={{ color: '#166534', display: 'block', marginBottom: '6px' }}>
                  Inclusions
                </strong>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
                  {inclusions.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>
            )}

            {exclusions.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '12px',
                }}
              >
                <strong style={{ color: '#991b1b', display: 'block', marginBottom: '6px' }}>
                  Exclusions
                </strong>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
                  {exclusions.map((exc, i) => (
                    <li key={i}>{exc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {formData.notes && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>
              Terms & Notes
            </strong>
            <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-wrap' }}>{formData.notes}</p>
          </div>
        )}

        {/* Footer buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
