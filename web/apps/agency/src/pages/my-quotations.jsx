import { useEffect, useState } from 'react';
import { FiFileText, FiAlertCircle } from 'react-icons/fi';
import { toast } from '@troublefree/ui';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { agencyQuotationApi } from '../lib/api.js';
import { AgencyQuotationList } from '../components/AgencyQuotationList.jsx';

export function MyQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await agencyQuotationApi.list();
        if (!cancelled) setQuotations(data.quotations ?? data ?? []);
      } catch (e) {
        const msg = e?.message ?? 'Failed to load quotations.';
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
  }, []);

  return (
    <AgencyAppLayout activeItem="quotations">
      <div className="agency-page-header">
        <div>
          <h1 className="agency-page-title">My Quotations</h1>
          <p className="agency-page-subtitle">
            Track and manage your submitted proposals, pricing structures, and draft offers for
            client travel requests.
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
      ) : quotations.length === 0 ? (
        <div className="agency-empty-state">
          <FiFileText className="agency-empty-icon" />
          <h3 className="agency-empty-title">No quotations yet</h3>
          <p className="agency-empty-subtitle">
            You haven't submitted any quotations to travel requests. Select an incoming request from
            your inbox to craft your first proposal.
          </p>
        </div>
      ) : (
        <AgencyQuotationList quotations={quotations} />
      )}
    </AgencyAppLayout>
  );
}
