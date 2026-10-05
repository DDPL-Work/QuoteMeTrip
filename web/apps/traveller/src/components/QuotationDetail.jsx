import { useEffect, useState } from 'react';
import { FiStar, FiCalendar, FiDollarSign, FiInfo, FiShield, FiTag } from 'react-icons/fi';
import { QUOTATION_TYPE_LABELS } from '@troublefree/types';
import { QuotationItemList } from './QuotationItemList.jsx';
import { agencyRatingApi } from '../lib/api.js';

export function QuotationDetail({ quotation }) {
  const [ratingSummary, setRatingSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const agencyId = quotation?.agency?.id ?? quotation?.agencyId;
    if (agencyId) {
      (async () => {
        try {
          const res = await agencyRatingApi.getRatingSummary(agencyId);
          if (!cancelled) setRatingSummary(res);
        } catch {
          // Soft fail
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [quotation]);

  if (!quotation) return <p className="tf-empty-state">No quotation found.</p>;
  const agency = quotation.agency ?? {};

  const averageRating = ratingSummary?.averageRating
    ? Number(ratingSummary.averageRating).toFixed(1)
    : agency.averageRating
      ? Number(agency.averageRating).toFixed(1)
      : null;

  return (
    <section
      className="tf-card"
      aria-label="Quotation detail"
      style={{
        background: '#ffffff',
        borderRadius: '1rem',
        padding: '1.75rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: '0 0 0.35rem',
              color: '#0c4e28',
              letterSpacing: '-0.02em',
            }}
          >
            Quotation #{quotation.id} ({quotation.status ?? '—'})
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: '#475569',
              fontWeight: 600,
            }}
          >
            <span>
              Type:{' '}
              {QUOTATION_TYPE_LABELS[quotation.quotationType] ?? quotation.quotationType ?? '—'}
            </span>
            {quotation.validUntil && (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}
              >
                <FiCalendar /> Valid until: {quotation.validUntil}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#166534',
              fontWeight: 700,
              display: 'block',
            }}
          >
            Total Package Price
          </span>
          <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0c4e28' }}>
            Total: {quotation.totalAmount ?? quotation.total ?? '—'} {quotation.currency ?? ''}
          </strong>
        </div>
      </div>

      {/* Agency Card */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Responding Agency
          </span>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              margin: '0.1rem 0 0.2rem',
              color: '#1e293b',
            }}
          >
            Agency: {agency.agencyName ?? '—'}
            {agency.city ? `, ${agency.city}` : ''}
            {agency.country ? `, ${agency.country}` : ''}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Valid until: {quotation.validUntil ?? '—'}
          </p>
        </div>

        <div>
          {averageRating ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#b45309',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              <FiStar style={{ fill: '#f59e0b', stroke: '#d97706' }} /> ★ {averageRating} rating
            </div>
          ) : (
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No ratings yet
            </span>
          )}
        </div>
      </div>

      {/* Notes / Terms */}
      {quotation.notes && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem',
          }}
        >
          <h4
            style={{
              margin: '0 0 0.35rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            Agency Notes & Conditions
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
            Notes: {quotation.notes}
          </p>
        </div>
      )}

      {/* Line Items Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#0c4e28',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FiTag /> Itemized Service Breakdown
        </h3>
        <QuotationItemList items={quotation.items ?? []} currency={quotation.currency} />
      </div>

      {/* Payment Model Off-Platform Notice */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          color: '#92400e',
          fontSize: '0.875rem',
        }}
      >
        <FiInfo
          style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '0.1rem', color: '#d97706' }}
        />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.15rem' }}>
            Direct Off-Platform Payment Terms
          </strong>
          Payment is arranged directly with the agency outside the platform upon quotation
          acceptance. The platform does not collect or process travel service payments.
        </div>
      </div>
    </section>
  );
}
