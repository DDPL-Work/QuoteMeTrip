import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agencyQuotationApi } from '../lib/api.js';
import { QuotationForm } from '../components/QuotationForm.jsx';

export function QuotationEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agencyQuotationApi.getById(id);
        if (!cancelled) setInitial(data.quotation ?? data);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load quotation.');
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
      navigate(`/quotations/${quotation.id ?? id}`);
    } catch (e) {
      setError(e?.message ?? 'Failed to save quotation.');
      throw e;
    }
  }

  if (loading)
    return (
      <main>
        <p>Loading…</p>
      </main>
    );

  return (
    <main>
      <h1>Edit quotation #{id}</h1>
      {error && <p role="alert">{error}</p>}
      {initial && (
        <QuotationForm initial={initial} onSubmit={handleSave} submitLabel="Save draft" />
      )}
    </main>
  );
}
