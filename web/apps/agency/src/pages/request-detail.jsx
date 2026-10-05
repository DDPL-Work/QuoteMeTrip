import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { AgencyRequestDetail } from '../components/AgencyRequestDetail.jsx';
import { agencyRequestApi } from '../lib/api.js';

export function AgencyRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isViewed, setIsViewed] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agencyRequestApi.getById(id);
      const reqObj = data?.request ?? data;
      const matchObj = data?.match ?? reqObj?.match ?? null;

      setRequest(reqObj);
      setMatch(matchObj);

      // Auto mark viewed if currently matched
      const currentMatchStatus =
        matchObj?.matchStatus ?? reqObj?.matchStatus ?? reqObj?.match?.matchStatus;
      if (currentMatchStatus === 'viewed') {
        setIsViewed(true);
      } else if (currentMatchStatus === 'matched') {
        agencyRequestApi
          .markViewed(id)
          .then((viewedRes) => {
            if (viewedRes?.match) {
              setMatch(viewedRes.match);
              setRequest((prev) => (prev ? { ...prev, match: viewedRes.match } : prev));
            }
            setIsViewed(true);
          })
          .catch(() => {});
      }
    } catch (e) {
      setError(e?.message ?? 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleMarkViewed() {
    try {
      const data = await agencyRequestApi.markViewed(id);
      const updatedMatch = data?.match ?? { matchStatus: 'viewed' };
      setMatch(updatedMatch);
      setRequest((prev) => (prev ? { ...prev, match: updatedMatch } : prev));
      setIsViewed(true);
      setNotice('Marked as viewed.');
    } catch (e) {
      setError(e?.message ?? 'Failed to mark as viewed.');
    }
  }

  return (
    <AgencyAppLayout activeItem="requests">
      {notice && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
          role="status"
        >
          <FiCheckCircle /> {notice}
        </div>
      )}

      {error && (
        <div className="agency-error-state" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiAlertCircle style={{ fontSize: '1.4rem' }} />
            <span>{error}</span>
          </div>
          <button type="button" className="agency-btn agency-btn-secondary" onClick={loadDetail}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="agency-skeleton" style={{ height: '120px', borderRadius: '1rem' }} />
          <div className="agency-skeleton" style={{ height: '240px', borderRadius: '1rem' }} />
        </div>
      ) : (
        <AgencyRequestDetail
          request={request}
          match={match}
          onMarkViewed={handleMarkViewed}
          isViewed={isViewed}
        />
      )}
    </AgencyAppLayout>
  );
}
