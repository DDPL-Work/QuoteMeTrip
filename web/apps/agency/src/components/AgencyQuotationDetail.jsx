import { Link } from 'react-router-dom';
import { FiEdit2, FiSend, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { QuotationSummary } from './QuotationSummary.jsx';

export function AgencyQuotationDetail({ quotation, onSubmit, onWithdraw }) {
  if (!quotation) return <p className="agency-empty-state">No quotation found.</p>;
  const status = quotation.status;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <QuotationSummary quotation={quotation} />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          background: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid var(--agency-border)',
        }}
      >
        {status === 'draft' && (
          <Link
            to={`/quotations/${quotation.id}/edit`}
            className="agency-btn agency-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiEdit2 /> Edit quotation
          </Link>
        )}

        {status === 'draft' && (
          <button
            type="button"
            onClick={() => onSubmit?.(quotation.id)}
            className="agency-btn agency-btn-accent"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiSend /> Submit quotation
          </button>
        )}

        {(status === 'draft' || status === 'submitted') && (
          <button
            type="button"
            onClick={() => onWithdraw?.(quotation.id)}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FiXCircle /> Withdraw quotation
          </button>
        )}

        {status === 'accepted' && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FiCheckCircle /> Quotation Accepted by Traveller
          </div>
        )}
      </div>
    </div>
  );
}
