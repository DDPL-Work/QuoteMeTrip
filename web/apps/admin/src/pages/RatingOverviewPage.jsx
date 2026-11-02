import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiStar,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiMessageSquare,
  FiAward,
  FiTrendingUp,
} from 'react-icons/fi';
import { adminApi } from '../services/api.js';
import { useI18n, formatDate } from '@troublefree/i18n';
import { AlertBanner } from '../components/AlertBanner.jsx';

export function RatingOverviewPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState(''); // '' | '5' | '4' | '3' | '2' | '1'

  // Pagination state (client-side matching dataset)
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ratingsData, summaryData] = await Promise.all([
        adminApi.listRatings(),
        adminApi.getRatingSummary(),
      ]);
      setRatings(Array.isArray(ratingsData) ? ratingsData : []);
      setSummary(summaryData || { totalRatings: 0, averageRating: 0 });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to load ratings and review analytics.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Score distribution breakdown computed from real ratings
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const val = Number(r.rating);
      if (counts[val] !== undefined) {
        counts[val] += 1;
      }
    });
    return counts;
  }, [ratings]);

  // Filtered ratings
  const filteredRatings = useMemo(() => {
    return ratings.filter((r) => {
      const agencyName = r.agency?.companyName || r.agency?.agencyName || '';
      const travellerName = r.traveller?.name || r.traveller?.email || '';
      const jobIdStr = String(r.jobId || r.job?.id || '');

      const matchesQuery =
        !searchQuery ||
        agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        travellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jobIdStr.includes(searchQuery);

      const matchesScore = !scoreFilter || String(r.rating) === String(scoreFilter);

      return matchesQuery && matchesScore;
    });
  }, [ratings, searchQuery, scoreFilter]);

  // Paginated chunk
  const totalItems = filteredRatings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRatings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRatings.slice(start, start + pageSize);
  }, [filteredRatings, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const renderStars = (score) => {
    const num = Math.round(Number(score) || 0);
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            style={{
              fill: star <= num ? '#F59E0B' : 'none',
              stroke: star <= num ? '#F59E0B' : '#CBD5E1',
              fontSize: '1rem',
            }}
          />
        ))}
        <span style={{ marginLeft: '4px', fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>
          {Number(score).toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0, fontWeight: 700 }}>
            {t('admin.ratings.title', 'Rating & Review Overview')}
          </h1>
          <p style={{ color: '#718096', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {t('admin.ratings.subtitle', 'Track marketplace feedback, customer satisfaction scores, and completed job ratings.')}
          </p>
        </div>
        <div>
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <FiRefreshCw className={loading ? 'admin-spin' : ''} /> {t('admin.common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Overall Average */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <FiStar />
          </div>
          <div style={{ flex: 1 }}>
            <div className="admin-stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span>{summary ? Number(summary.averageRating).toFixed(1) : '—'}</span>
              <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ 5.0</span>
            </div>
            <div className="admin-stat-label">
              {t('admin.ratings.averageRating', 'Average Score')}
            </div>
          </div>
        </div>

        {/* Total Ratings Count */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <FiAward />
          </div>
          <div style={{ flex: 1 }}>
            <div className="admin-stat-value">
              {summary ? summary.totalRatings : '—'}
            </div>
            <div className="admin-stat-label">
              {t('admin.ratings.totalRatings', 'Total Reviews Submitted')}
            </div>
          </div>
        </div>

        {/* 5-Star Count */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <FiCheckCircle />
          </div>
          <div style={{ flex: 1 }}>
            <div className="admin-stat-value">
              {distribution[5]}
            </div>
            <div className="admin-stat-label">
              {t('admin.ratings.fiveStarRatings', '5-Star Perfect Ratings')}
            </div>
          </div>
        </div>

        {/* Critical Ratings (1-2 Stars) */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <FiTrendingUp style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="admin-stat-value">
              {distribution[1] + distribution[2]}
            </div>
            <div className="admin-stat-label">
              {t('admin.ratings.needsAttention', 'Scores Under 3 Stars')}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Breakdown Bar Chart Widget */}
      <div className="admin-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', margin: '0 0 1rem 0' }}>
          {t('admin.ratings.distribution', 'Score Breakdown')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const total = summary?.totalRatings || 1;
            const pct = Math.round((count / (summary?.totalRatings || 1)) * 100);

            return (
              <div
                key={stars}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ width: '60px', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569', fontWeight: 600 }}>
                  <span>{stars}</span>
                  <FiStar style={{ fill: '#F59E0B', stroke: '#F59E0B', fontSize: '0.875rem' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '10px',
                    background: '#F1F5F9',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${summary?.totalRatings ? pct : 0}%`,
                      background: stars >= 4 ? '#10B981' : stars === 3 ? '#F59E0B' : '#EF4444',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ width: '80px', textAlign: 'right', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                  {count} ({summary?.totalRatings ? pct : 0}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0AEC0',
            }}
          />
          <input
            type="text"
            placeholder={t('admin.ratings.searchPlaceholder', 'Search by agency, traveller name, or Job ID...')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handlePageChange(1);
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '6px',
              border: '1px solid #CBD5E0',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFilter style={{ color: '#718096' }} />
          <select
            value={scoreFilter}
            onChange={(e) => {
              setScoreFilter(e.target.value);
              handlePageChange(1);
            }}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #CBD5E0',
              fontSize: '0.9rem',
              background: '#FFF',
            }}
          >
            <option value="">{t('admin.ratings.allScores', 'All Star Ratings')}</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
            <FiRefreshCw className="admin-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} />
            <div>{t('admin.common.loading', 'Loading data...')}</div>
          </div>
        ) : paginatedRatings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
            <FiStar style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#2D3748' }}>
              {t('admin.ratings.noRatingsFound', 'No reviews or ratings found')}
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {searchQuery || scoreFilter
                ? t('admin.common.tryAdjustingFilters', 'Try adjusting your search or star rating filter.')
                : t('admin.ratings.noRatingsYet', 'As travellers complete booked jobs, their verified ratings will appear here.')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.875rem 1rem' }}>{t('admin.ratings.score', 'Rating Score')}</th>
                  <th style={{ padding: '0.875rem 1rem' }}>{t('admin.ratings.agency', 'Agency')}</th>
                  <th style={{ padding: '0.875rem 1rem' }}>{t('admin.ratings.traveller', 'Traveller')}</th>
                  <th style={{ padding: '0.875rem 1rem' }}>{t('admin.ratings.jobId', 'Linked Job')}</th>
                  <th style={{ padding: '0.875rem 1rem' }}>{t('admin.ratings.date', 'Submitted At')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRatings.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#64748B' }}>#{item.id}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {renderStars(item.rating)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>
                        {item.agency?.companyName || item.agency?.agencyName || `Agency #${item.agencyId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        ID #{item.agencyId}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ color: '#1E293B', fontWeight: 500 }}>
                        {item.traveller?.name || 'Verified Traveller'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        ID #{item.travellerId}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className="admin-badge admin-badge-info">
                        Job #{item.jobId}
                      </span>
                      {item.job?.status && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                          ({item.job.status})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {item.createdAt || item.created_at ? formatDate(item.createdAt || item.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              fontSize: '0.85rem',
              color: '#64748B',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} reviews
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

