import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { toast } from '@troublefree/ui';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { agencyQuotationApi, agencyRequestApi } from '../lib/api.js';
import { QuotationForm } from '../components/QuotationForm.jsx';

export function CreateQuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agencyRequestApi.getById(id);
        if (!cancelled) setRequest(data.request ?? data);
      } catch {
        // Soft fail on context load: form works regardless
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(payload) {
    setError(null);
    try {
      const data = await agencyQuotationApi.createForRequest(id, payload);
      const quotation = data.quotation ?? data;
      toast.success('Quotation draft saved successfully.');
      navigate(`/quotations/${quotation.id}`);
    } catch (e) {
      const msg = e?.message ?? 'Failed to save quotation.';
      setError(msg);
      toast.error(msg);
      throw e;
    }
  }

  return (
    <AgencyAppLayout activeItem="quotations">
      <Link
        to={`/requests/${id}`}
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
        <FiArrowLeft /> Back to Request #{id}
      </Link>

      <div className="agency-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="agency-page-title" style={{ fontSize: '1.65rem' }}>
            New quotation for request #{id}
          </h1>
          <p className="agency-page-subtitle">
            Craft an official customized proposal with itemized services, pricing, and validity
            terms.
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

      <div className="agency-card">
        <QuotationForm travelRequest={request} onSubmit={handleSave} submitLabel="Save draft" />
      </div>
    </AgencyAppLayout>
  );
}
