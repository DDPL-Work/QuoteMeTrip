import React from 'react';
import { StatusBadge } from '@troublefree/ui';
import { FiStar, FiCalendar, FiArrowRight, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export function QuotationCard({ quotation }) {
  if (!quotation) return null;

  const agency = quotation.agency || {};
  const ratingSummary = quotation.ratingSummary || agency.ratingSummary || null;
  const averageRating = ratingSummary?.averageRating || agency.rating || null;
  const reviewCount = ratingSummary?.totalReviews || agency.reviewCount || 0;

  const formattedTotal = quotation.totalAmount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: quotation.currency || 'USD',
      }).format(quotation.totalAmount)
    : `${quotation.currency || '$'}${quotation.totalAmount || 0}`;

  return (
    <li
      className="tf-card"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                {agency.name || agency.agencyName || `Agency #${quotation.agencyId || ''}`}
              </h3>
              {quotation.version > 1 && (
                <span style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  Revision {quotation.version}
                </span>
              )}
            </div>
            {agency.verified && (
              <span
                title="Verified Agency"
                style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}
              >
                <FiCheckCircle size={16} />
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              color: '#64748b',
            }}
          >
            {averageRating ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#d97706',
                  fontWeight: 600,
                }}
              >
                <FiStar size={14} style={{ fill: '#d97706' }} />
                {Number(averageRating).toFixed(1)}
                {reviewCount > 0 && (
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>({reviewCount})</span>
                )}
              </span>
            ) : (
              <span>No ratings yet</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {formattedTotal}
          </div>
          <StatusBadge status={quotation.status} />
        </div>
      </div>

      {quotation.notes && (
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '0.9rem',
            color: '#475569',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {quotation.notes}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
          <FiCalendar size={14} />
          <span>
            Valid until:{' '}
            {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to={`/messages?requestId=${quotation.travelRequestId}&agencyId=${quotation.agencyId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#0369a1',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            <FiMessageSquare size={14} /> Message Agency
          </Link>
          <Link
            to={`/quotations/${quotation.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#166534',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View quotation <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </li>
  );
}
