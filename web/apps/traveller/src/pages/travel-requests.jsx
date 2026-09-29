import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { travelRequestApi } from '../lib/api.js';

export function TravelRequestsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await travelRequestApi.list();
        if (!cancelled) setItems(data.requests ?? data ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load requests.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>Travel requests</h1>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <Link to={`/travel-requests/${r.id}`}>
                Request #{r.id} ({r.status})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
