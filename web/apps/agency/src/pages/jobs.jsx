// Agency job list (Phase 6).

import { useEffect, useState } from 'react';
import { jobApi } from '../lib/api.js';
import { JobListView } from '../components/Phase6.jsx';

export function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await jobApi.list();
        if (!cancelled) setJobs(data.jobs ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load jobs.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="tf-page">
      <h1>Jobs</h1>
      {error && <p role="alert">{error}</p>}
      <JobListView jobs={jobs} />
    </main>
  );
}
