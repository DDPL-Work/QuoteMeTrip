// Agency job detail (Phase 6).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jobApi } from '../lib/api.js';
import { JobDetailView } from '../components/Phase6.jsx';

export function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await jobApi.getById(id);
        if (!cancelled) setJob(data.job ?? data);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load job.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleStatusChange(status) {
    try {
      const data = await jobApi.updateStatus(id, status);
      setJob(data.job ?? data);
    } catch (e) {
      setError(e?.message ?? 'Failed to update job.');
    }
  }

  return (
    <main className="tf-page">
      <h1>Job #{id}</h1>
      {error && <p role="alert">{error}</p>}
      <JobDetailView job={job} onStatusChange={handleStatusChange} />
    </main>
  );
}
