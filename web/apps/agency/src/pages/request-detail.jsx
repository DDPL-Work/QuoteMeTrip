import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agencyRequestApi } from '../lib/api.js';
import { AgencyRequestDetail } from '../components/AgencyRequestDetail.jsx';

export function AgencyRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agencyRequestApi.getById(id);
        if (cancelled) return;
        setRequest(data.request ?? data);
        setMatch(data.match ?? null);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load request.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleMarkViewed() {
    try {
      const data = await agencyRequestApi.markViewed(id);
      setMatch(data.match ?? null);
      setNotice('Marked as viewed.');
    } catch (e) {
      setError(e?.message ?? 'Failed to mark as viewed.');
    }
  }

  return (
    <main>
      <h1>Request #{id}</h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <AgencyRequestDetail request={request} match={match} />
      <button type="button" onClick={handleMarkViewed}>
        Mark as viewed
      </button>
    </main>
  );
}
