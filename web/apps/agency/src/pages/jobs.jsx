import { useEffect, useState } from 'react';
import { FiBriefcase, FiAlertCircle } from 'react-icons/fi';
import { toast } from '@troublefree/ui';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { jobApi } from '../lib/api.js';
import { JobListView } from '../components/Phase6.jsx';

export function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await jobApi.list();
        if (!cancelled) setJobs(data.jobs ?? []);
      } catch (e) {
        const msg = e?.message ?? 'Failed to load jobs.';
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AgencyAppLayout activeItem="jobs">
      <div className="agency-page-header">
        <div>
          <h1 className="agency-page-title">Active Trips & Jobs</h1>
          <p className="agency-page-subtitle">
            Manage confirmed travel bookings, execute accepted itineraries, and access revealed
            traveller contact details.
          </p>
        </div>
      </div>

      {error && (
        <div className="agency-error-state" role="alert" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiAlertCircle style={{ fontSize: '1.4rem' }} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="agency-skeleton" style={{ height: '180px', borderRadius: '0.75rem' }} />
      ) : jobs.length === 0 ? (
        <div className="agency-empty-state">
          <FiBriefcase className="agency-empty-icon" />
          <h3 className="agency-empty-title">No jobs yet</h3>
          <p className="agency-empty-subtitle">
            Confirmed jobs will appear here as soon as a traveller accepts one of your submitted
            quotations.
          </p>
        </div>
      ) : (
        <JobListView jobs={jobs} />
      )}
    </AgencyAppLayout>
  );
}
