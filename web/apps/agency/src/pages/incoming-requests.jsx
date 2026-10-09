import { useEffect, useState, useCallback } from 'react';
import {
  FiSearch,
  FiFilter,
  FiInbox,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { AgencyRequestCard } from '../components/AgencyRequestCard.jsx';
import { toast } from '@troublefree/ui';
import { agencyRequestApi } from '../lib/api.js';
import { TRAVEL_REQUEST_AGENCY_STATUSES } from '@troublefree/types';
import { useI18n } from '@troublefree/i18n';

const DEFAULT_FILTER = '';

export function IncomingRequestsPage() {
  const { t } = useI18n();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [matchStatus, setMatchStatus] = useState(DEFAULT_FILTER);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRequests = useCallback(
    async (page = 1, status = matchStatus, search = debouncedSearch) => {
      setLoading(true);
      setError(null);
      try {
        const data = await agencyRequestApi.list({
          page,
          pageSize: pagination.pageSize,
          matchStatus: status || undefined,
          search: search || undefined,
        });

        const reqList = data.requests ?? data.data ?? (Array.isArray(data) ? data : []);
        setRequests(reqList);

        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination({
            page,
            pageSize: 10,
            totalPages: Math.ceil(reqList.length / 10) || 1,
            totalItems: reqList.length,
          });
        }
      } catch (e) {
        const msg = e?.message ?? 'Failed to load travel requests.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [matchStatus, debouncedSearch, pagination.pageSize],
  );

  useEffect(() => {
    loadRequests(1, matchStatus, debouncedSearch);
  }, [matchStatus, debouncedSearch, loadRequests]);

  return (
    <AgencyAppLayout activeItem="requests">
      {/* Page Header */}
      <div className="agency-page-header">
        <div>
          <h1 className="agency-page-title">Travel Requests</h1>
          <p className="agency-page-subtitle">
            Review incoming requests matched to your agency. Explore client itineraries, dates,
            group sizes, and service requirements.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="agency-filter-bar">
        <div className="agency-search-input-wrap">
          <FiSearch className="agency-search-icon" />
          <input
            type="text"
            className="agency-input"
            placeholder="Search by destination or traveller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search travel requests"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FiFilter style={{ color: 'var(--agency-text-light)' }} />
          <select
            className="agency-select"
            aria-label="Match status filter"
            value={matchStatus}
            onChange={(e) => setMatchStatus(e.target.value)}
          >
            <option value={DEFAULT_FILTER}>Active Requests (matched, viewed, quoted)</option>
            <option value="">All Statuses</option>
            {TRAVEL_REQUEST_AGENCY_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="agency-error-state" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiAlertCircle style={{ fontSize: '1.4rem' }} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="agency-btn agency-btn-secondary"
            onClick={() => loadRequests(pagination.page, matchStatus, debouncedSearch)}
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="agency-requests-stack">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="agency-skeleton"
              style={{ height: '100px', borderRadius: '0.75rem' }}
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="agency-empty-state">
          <FiInbox className="agency-empty-icon" />
          <h3 className="agency-empty-title">No matching requests found</h3>
          <p className="agency-empty-subtitle">
            There are currently no travel requests matching your active filter criteria.
          </p>
        </div>
      ) : (
        <div className="agency-requests-stack">
          {requests.map((req) => (
            <AgencyRequestCard
              key={req.id}
              request={req}
              isNew={(req.matchStatus ?? req.match?.matchStatus) === 'matched'}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--agency-border)',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--agency-text-muted)' }}>
            Showing Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> ({pagination.totalItems} total)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="agency-btn agency-btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => loadRequests(pagination.page - 1)}
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              type="button"
              className="agency-btn agency-btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadRequests(pagination.page + 1)}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </AgencyAppLayout>
  );
}
