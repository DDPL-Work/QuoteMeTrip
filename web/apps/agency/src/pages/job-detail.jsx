import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { toast } from '@troublefree/ui';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
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
        const msg = e?.message ?? 'Failed to load job.';
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
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
      toast.success(`Job status updated to ${status}`);
    } catch (e) {
      const msg = e?.message ?? 'Failed to update job.';
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <AgencyAppLayout activeItem="jobs">
      <Link
        to="/jobs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--agency-secondary)',
          fontWeight: 600,
          fontSize: '0.9rem',
          marginBottom: '1rem',
          textDecoration: 'none',
        }}
      >
        <FiArrowLeft /> Back to Jobs
      </Link>

      <div className="agency-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="agency-page-title" style={{ fontSize: '1.65rem' }}>
            Job #{id}
          </h1>
          <p className="agency-page-subtitle">
            Operational trip execution and confirmed booking details.
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

      <JobDetailView job={job} onStatusChange={handleStatusChange} />
    </AgencyAppLayout>
  );
}
