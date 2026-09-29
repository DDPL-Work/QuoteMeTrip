import { useEffect, useState } from 'react';
import { agencyRequestApi } from '../lib/api.js';
import { AgencyRequestList } from '../components/AgencyRequestList.jsx';
import { TRAVEL_REQUEST_AGENCY_STATUSES } from '@troublefree/types';

const DEFAULT_FILTER = 'matched,viewed,quoted';

export function IncomingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [matchStatus, setMatchStatus] = useState(DEFAULT_FILTER);
  const [error, setError] = useState(null);

  async function load(page = 1, status = matchStatus) {
    setError(null);
    try {
      const data = await agencyRequestApi.list({
        page,
        pageSize: pagination.pageSize,
        matchStatus: status || undefined,
      });
      setRequests(data.requests ?? []);
      setPagination(data.pagination ?? { page, pageSize: 20, totalPages: 1, totalItems: 0 });
    } catch (e) {
      setError(e?.message ?? 'Failed to load requests.');
    }
  }

  useEffect(() => {
    load(1, matchStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchStatus]);

  return (
    <main>
      <h1>Incoming requests</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Match status
        <select
          aria-label="Match status"
          value={matchStatus}
          onChange={(e) => setMatchStatus(e.target.value)}
        >
          <option value={DEFAULT_FILTER}>Active (matched, viewed, quoted)</option>
          <option value="">All</option>
          {TRAVEL_REQUEST_AGENCY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <AgencyRequestList requests={requests} />
      <p>
        Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
      </p>
      <button
        type="button"
        disabled={pagination.page <= 1}
        onClick={() => load(pagination.page - 1)}
      >
        Previous
      </button>
      <button
        type="button"
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => load(pagination.page + 1)}
      >
        Next
      </button>
    </main>
  );
}
