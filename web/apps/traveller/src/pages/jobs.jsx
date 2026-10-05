import { useEffect, useState, useMemo } from 'react';
import { PageHeader, Skeleton, ErrorState, EmptyState } from '@troublefree/ui';
import { FiBriefcase } from 'react-icons/fi';
import { jobApi } from '../lib/api.js';
import { JobListView } from '../components/Phase6.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';

export function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobApi.list();
      setJobs(data.jobs ?? []);
    } catch (e) {
      setError(e?.message ?? 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    if (filter === 'ALL') return jobs;
    if (filter === 'ACTIVE') return jobs.filter((j) => j.status === 'accepted' || j.status === 'in_progress');
    if (filter === 'COMPLETED') return jobs.filter((j) => j.status === 'completed');
    if (filter === 'CANCELLED') return jobs.filter((j) => j.status === 'cancelled');
    return jobs;
  }, [jobs, filter]);

  return (
    <MotionPage>
      <main className="tf-portal-page" aria-label="My Trips">
        <PageHeader
          title="My Trips"
          subtitle="Track your confirmed bookings, ongoing journeys, and completed travel itineraries."
        />

        {/* Retain standard h1 for testing & accessibility */}
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
          My trips
        </h1>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Trips' },
            { key: 'ACTIVE', label: 'Active & In Progress' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: filter === tab.key ? '1px solid #147D33' : '1px solid #E2DCD1',
                background: filter === tab.key ? '#E5F2EA' : '#fff',
                color: filter === tab.key ? '#147D33' : '#4E5754',
                fontWeight: filter === tab.key ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: '20px' }}>
            <ErrorState title="Could not load trips" message={error} onRetry={loadJobs} />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
          </div>
        ) : (
          <JobListView jobs={filteredJobs} />
        )}
      </main>
    </MotionPage>
  );
}
