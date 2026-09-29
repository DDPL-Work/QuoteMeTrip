import { useEffect, useState } from 'react';
import { agencyQuotationApi } from '../lib/api.js';
import { AgencyQuotationList } from '../components/AgencyQuotationList.jsx';

export function MyQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agencyQuotationApi.list();
        if (!cancelled) setQuotations(data.quotations ?? data ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load quotations.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>My quotations</h1>
      {error && <p role="alert">{error}</p>}
      <AgencyQuotationList quotations={quotations} />
    </main>
  );
}
