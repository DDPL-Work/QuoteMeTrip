import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
      setNotice('Quotation submitted.');
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
    <main>
      <h1>Quotation #{id}</h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <AgencyQuotationDetail
        quotation={quotation}
        onSubmit={handleSubmit}
        onWithdraw={handleWithdraw}
      />
    </main>
  );
}
