import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { PageHeader, Skeleton, ErrorState } from '@troublefree/ui';
import { jobApi } from '../lib/api.js';
import { JobDetailView } from '../components/Phase6.jsx';
import { JobRatingSection } from '../components/JobRatingSection.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';

export function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobApi.getById(id);
      setJob(data.job ?? data);
    } catch (e) {
      setError(e?.message ?? 'Failed to load job.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const data = await jobApi.updateStatus(id, { status: newStatus });
      setJob(data.job ?? data);
    } catch (e) {
      setError(e?.message ?? 'Failed to update job status.');
    }
  };

  return (
    <MotionPage>
      <main className="tf-portal-page" aria-label="Job Detail">
        <Link
          to="/jobs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--tf-portal-green, #147D33)',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '16px',
            textDecoration: 'none',
          }}
        >
          <FiArrowLeft size={16} /> Back to My Trips
        </Link>

        {/* Retain standard h1 for testing & accessibility */}
        <h1 style={{ margin: '0 0 16px', fontSize: '1.5rem', color: 'var(--tf-portal-text-primary, #13291C)' }}>
          Job #{id}
        </h1>

        {error && (
          <div role="alert" style={{ marginBottom: '20px' }}>
            <ErrorState title="Could not load trip details" message={error} onRetry={loadJob} />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height="140px" borderRadius="12px" />
            <Skeleton height="200px" borderRadius="12px" />
          </div>
        ) : (
          <>
            <JobDetailView job={job} onStatusChange={handleStatusChange} />
            {job?.status === 'completed' && (
              <div style={{ marginTop: '24px' }}>
                <JobRatingSection jobId={job.id} />
              </div>
            )}
          </>
        )}
      </main>
    </MotionPage>
  );
}
