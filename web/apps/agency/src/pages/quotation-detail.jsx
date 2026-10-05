import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { agencyQuotationApi } from '../lib/api.js';
import { AgencyQuotationDetail } from '../components/AgencyQuotationDetail.jsx';

export function QuotationDetailPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function load() {
    try {
      const data = await agencyQuotationApi.getById(id);
      setQuotation(data.quotation ?? data);
    } catch (e) {
      setError(e?.message ?? 'Failed to load quotation.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit() {
    try {
      const data = await agencyQuotationApi.submit(id);
      setQuotation(data.quotation ?? data);
      setNotice('Quotation submitted successfully.');
    } catch (e) {
      setError(e?.message ?? 'Failed to submit quotation.');
    }
  }

  async function handleWithdraw() {
    try {
      const data = await agencyQuotationApi.withdraw(id);
      setQuotation(data.quotation ?? data);
      setNotice('Quotation withdrawn.');
    } catch (e) {
      setError(e?.message ?? 'Failed to withdraw quotation.');
    }
  }

  return (
    <AgencyAppLayout activeItem="quotations">
      <Link
        to="/quotations"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--agency-secondary)',
          fontWeight: 600,
          fontSize: '0.9rem',
          marginBottom: '1rem',
          textDecoration: 'none',
        }}
      >
        <FiArrowLeft /> Back to My Quotations
      </Link>

      <div className="agency-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="agency-page-title" style={{ fontSize: '1.65rem' }}>
            Quotation #{id}
          </h1>
          <p className="agency-page-subtitle">
            Official customized proposal, service breakdown, and financial quote for client travel
            request.
          </p>
        </div>
      </div>

      {error && (
        <div className="agency-error-state" role="alert" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiAlertCircle style={{ fontSize: '1.4rem' }} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {notice && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
          role="status"
        >
          <FiCheckCircle /> {notice}
        </div>
      )}

      <AgencyQuotationDetail
        quotation={quotation}
        onSubmit={handleSubmit}
        onWithdraw={handleWithdraw}
      />
    </AgencyAppLayout>
  );
}
