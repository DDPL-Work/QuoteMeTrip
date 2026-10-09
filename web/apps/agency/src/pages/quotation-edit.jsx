import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { toast } from '@troublefree/ui';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { agencyQuotationApi, agencyRequestApi } from '../lib/api.js';
import { QuotationForm } from '../components/QuotationForm.jsx';

export function QuotationEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agencyQuotationApi.getById(id);
        const quote = data.quotation ?? data;
        if (!cancelled) {
          setInitial(quote);
          if (quote?.travelRequestId) {
            try {
              const reqData = await agencyRequestApi.getById(quote.travelRequestId);
              if (!cancelled) setRequest(reqData.request ?? reqData);
            } catch {
              // Non-blocking
            }
          }
        }
      } catch (e) {
        const msg = e?.message ?? 'Failed to load quotation.';
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(payload) {
    setError(null);
    try {
      const data = await agencyQuotationApi.update(id, payload);
      const quotation = data.quotation ?? data;
      toast.success('Quotation updated successfully.');
      navigate(`/quotations/${quotation.id ?? id}`);
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
        to={`/quotations/${id}`}
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
        <FiArrowLeft /> Back to Quotation #{id}
      </Link>

      <div className="agency-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="agency-page-title" style={{ fontSize: '1.65rem' }}>
            Edit quotation #{id}
          </h1>
          <p className="agency-page-subtitle">
            Update line item services, pricing, currency, or validity dates for this draft proposal.
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

      {loading ? (
        <div className="agency-skeleton" style={{ height: '180px', borderRadius: '0.75rem' }} />
      ) : initial ? (
        <div className="agency-card">
          <QuotationForm
            initial={initial}
            travelRequest={request}
            onSubmit={handleSave}
            submitLabel="Save draft"
          />
        </div>
      ) : null}
    </AgencyAppLayout>
  );
}
