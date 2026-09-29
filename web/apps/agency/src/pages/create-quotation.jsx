import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agencyQuotationApi } from '../lib/api.js';
import { QuotationForm } from '../components/QuotationForm.jsx';

export function CreateQuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  async function handleSave(payload) {
    setError(null);
    try {
      const data = await agencyQuotationApi.createForRequest(id, payload);
      const quotation = data.quotation ?? data;
      navigate(`/quotations/${quotation.id}`);
    } catch (e) {
      setError(e?.message ?? 'Failed to save quotation.');
      throw e;
    }
  }

  return (
    <main>
      <h1>New quotation for request #{id}</h1>
      {error && <p role="alert">{error}</p>}
      <QuotationForm onSubmit={handleSave} submitLabel="Save draft" />
    </main>
  );
}
