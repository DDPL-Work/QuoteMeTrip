import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiInbox,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiArrowRight,
  FiPlus,
  FiFileText,
  FiClock,
  FiFilter,
  FiSearch,
} from 'react-icons/fi';
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@troublefree/ui';
import { travelRequestApi } from '../lib/api.js';
import { MotionPage } from '../components/motion/MotionPage.jsx';

function getRouteTitle(r) {
  if (r.route?.stops && r.route.stops.length > 0) {
    const sorted = [...r.route.stops].sort(
      (a, b) => (a.orderIndex ?? a.stopOrder ?? 0) - (b.orderIndex ?? b.stopOrder ?? 0),
    );
    const names = sorted.map((s) => s.name || s.cityName || s.city || s.location).filter(Boolean);
    if (names.length > 1) {
      return `${names[0]} → ${names[names.length - 1]}${names.length > 2 ? ` (${names.length} stops)` : ''}`;
    }
    if (names.length === 1) return names[0];
  }
  if (r.route?.name) return r.route.name;
  if (r.destination) return `${r.origin ? `${r.origin} → ` : ''}${r.destination}`;
  return `Custom Itinerary #${r.id}`;
}

function formatDateRange(start, end) {
  if (!start) return 'Flexible Dates';
  if (!end || start === end) return start;
  return `${start} — ${end}`;
}

export function TravelRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await travelRequestApi.list();
      const list = Array.isArray(data) ? data : data?.requests ?? data?.items ?? [];
      setItems(list);
    } catch (e) {
      setError(e?.message ?? 'Failed to load travel requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const metrics = useMemo(() => {
    const total = items.length;
    const submitted = items.filter((r) => r.status === 'submitted').length;
    const quoted = items.filter((r) => r.status === 'quoted' || (r.quotationsCount && r.quotationsCount > 0)).length;
    const accepted = items.filter((r) => r.status === 'accepted' || r.status === 'job_created').length;
    return { total, submitted, quoted, accepted };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      if (filterStatus !== 'ALL' && r.status !== filterStatus.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const route = getRouteTitle(r).toLowerCase();
        const idStr = String(r.id);
        const pkg = (r.packageType || '').toLowerCase();
        return route.includes(query) || idStr.includes(query) || pkg.includes(query);
      }
      return true;
    });
  }, [items, filterStatus, searchQuery]);

  return (
    <MotionPage>
      <main className="tf-portal-page" aria-label="Travel Requests Page">
        <PageHeader
          title="Travel Requests"
          subtitle="View, track, and manage your custom travel requests and agency quotations."
          actions={
            <Link to="/plan-trip">
              <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FiPlus size={16} /> Plan New Trip
              </Button>
            </Link>
          }
        />

        {/* Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--tf-portal-border, #E2DCD1)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}
          >
            <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.85rem' }}>
              Total Requests
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--tf-portal-green, #147D33)' }}>
              {metrics.total}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--tf-portal-border, #E2DCD1)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}
          >
            <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.85rem' }}>
              Submitted / Open
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--tf-portal-text-primary, #13291C)' }}>
              {metrics.submitted}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--tf-portal-border, #E2DCD1)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}
          >
            <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.85rem' }}>
              Quoted
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FC7C00' }}>
              {metrics.quoted}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--tf-portal-border, #E2DCD1)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}
          >
            <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.85rem' }}>
              Accepted Offers
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0C4E28' }}>
              {metrics.accepted}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'SUBMITTED', 'QUOTED', 'ACCEPTED', 'DRAFT'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: filterStatus === st ? '1px solid #147D33' : '1px solid #E2DCD1',
                  background: filterStatus === st ? '#E5F2EA' : '#fff',
                  color: filterStatus === st ? '#147D33' : '#4E5754',
                  fontWeight: filterStatus === st ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <FiSearch
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#717D79',
              }}
            />
            <input
              type="text"
              placeholder="Search destination or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--tf-portal-border, #E2DCD1)',
                background: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height="120px" borderRadius="12px" />
            <Skeleton height="120px" borderRadius="12px" />
            <Skeleton height="120px" borderRadius="12px" />
          </div>
        ) : error ? (
          <ErrorState title="Could not load travel requests" message={error} onRetry={loadRequests} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<FiInbox size={40} />}
            title="No travel requests found"
            message={
              searchQuery || filterStatus !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'You have not submitted any travel requests yet. Start by planning your first route!'
            }
            action={
              <Link to="/plan-trip">
                <Button variant="primary">Create Travel Request</Button>
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredItems.map((r) => {
              const routeTitle = getRouteTitle(r);
              const dateRange = formatDateRange(r.startDate || r.travelDates?.startDate, r.endDate || r.travelDates?.endDate);
              const travellersCount = r.adultsCount ? `${r.adultsCount} Adult${r.adultsCount > 1 ? 's' : ''}${r.childrenCount ? `, ${r.childrenCount} Child` : ''}` : `${r.travellerCount || 1} Traveller(s)`;
              const luggage = r.luggageCount ? `${r.luggageCount} bags` : null;

              return (
                <div
                  key={r.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid var(--tf-portal-border, #E2DCD1)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div style={{ flex: '1 1 360px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--tf-portal-green, #147D33)',
                          background: 'var(--tf-portal-green-soft, #E5F2EA)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        Request #{r.id}
                      </span>
                      <StatusBadge status={r.status} />
                      {r.packageType && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: '#4E5754',
                            background: '#F0EAE1',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {r.packageType.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <h2
                      style={{
                        margin: '0 0 10px',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--tf-portal-text-primary, #13291C)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <FiMapPin size={18} style={{ color: '#147D33', flexShrink: 0 }} />
                      <span>{routeTitle}</span>
                    </h2>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        color: 'var(--tf-portal-text-muted, #4E5754)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiCalendar size={14} /> {dateRange}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiUsers size={14} /> {travellersCount}
                      </span>
                      {luggage && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FiBriefcase size={14} /> {luggage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '10px',
                      minWidth: '160px',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#4E5754', textAlign: 'right' }}>
                      {r.quotationsCount !== undefined ? (
                        <span>
                          <strong>{r.quotationsCount}</strong> quotation{r.quotationsCount === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={13} /> Active Request
                        </span>
                      )}
                    </div>

                    <Link to={`/travel-requests/${r.id}`} aria-label={`Request #${r.id} (${r.status})`}>
                      <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
                        {`Request #${r.id} (${r.status})`}
                      </span>
                      <Button
                        variant="primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>View Details</span>
                        <FiArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </MotionPage>
  );
}
