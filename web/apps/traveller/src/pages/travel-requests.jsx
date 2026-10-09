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
  FiClock,
  FiSearch,
  FiTrash2,
  FiArchive,
  FiLayers,
  FiDollarSign,
  FiMessageSquare,
} from 'react-icons/fi';
import {
  PageHeader,
  Button,
  StatusBadge,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  toast,
  getTravelRequestDisplayName,
  formatRequestIdentifier,
} from '@troublefree/ui';
import { travelRequestApi } from '../lib/api.js';
import { MotionPage } from '../components/motion/MotionPage.jsx';

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
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    const quoted = items.filter((r) => r.status === 'quoted' || (r.quotesCount && r.quotesCount > 0) || (r.quotationsCount && r.quotationsCount > 0)).length;
    const accepted = items.filter((r) => r.status === 'accepted' || r.status === 'job_created').length;
    return { total, submitted, quoted, accepted };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      if (filterStatus === 'QUOTED') {
        const isQuoted = r.status === 'quoted' || (r.quotesCount && r.quotesCount > 0) || (r.quotationsCount && r.quotationsCount > 0);
        if (!isQuoted) return false;
      } else if (filterStatus !== 'ALL' && r.status !== filterStatus.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const disp = getTravelRequestDisplayName(r).toLowerCase();
        const idStr = String(r.id);
        const refStr = formatRequestIdentifier(r.id).toLowerCase();
        const pkg = (r.packageType || '').toLowerCase();
        return disp.includes(query) || idStr.includes(query) || refStr.includes(query) || pkg.includes(query);
      }
      return true;
    });
  }, [items, filterStatus, searchQuery]);

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setDeleting(true);
    try {
      const res = await travelRequestApi.delete(requestToDelete.id);
      const isArchived = res?.archived;
      toast.success(
        isArchived
          ? `Request ${formatRequestIdentifier(requestToDelete.id)} archived from your workspace.`
          : `Draft ${formatRequestIdentifier(requestToDelete.id)} deleted successfully.`
      );
      setRequestToDelete(null);
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || 'Could not delete travel request.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MotionPage>
      <main className="tf-portal-page" aria-label="Travel Requests Page">
        <PageHeader
          title="Travel Requests"
          subtitle="Your central travel workspace: track requests, compare quotes, chat with agencies, and manage bookings."
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
              Quotes Received
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
              Accepted Bookings
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

          <div style={{ position: 'relative', minWidth: '240px' }}>
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
              placeholder="Search destination, QRY-ID…"
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
            <Skeleton height="130px" borderRadius="12px" />
            <Skeleton height="130px" borderRadius="12px" />
            <Skeleton height="130px" borderRadius="12px" />
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
              const displayName = getTravelRequestDisplayName(r);
              const refId = formatRequestIdentifier(r.id);
              const dateRange = formatDateRange(r.startDate || r.travelStartDate, r.endDate || r.travelEndDate);
              const travellersCount = r.numberOfTravellers ? `${r.numberOfTravellers} Traveller(s)` : `${r.travellerCount || 1} Traveller(s)`;
              const quotesCount = r.quotesCount ?? r.quotationsCount ?? 0;
              const luggage = r.luggageCount ? `${r.luggageCount} bags` : null;

              return (
                <div
                  key={r.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid var(--tf-portal-border, #E2DCD1)',
                    padding: '22px 26px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div style={{ flex: '1 1 380px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#147D33',
                          background: '#E5F2EA',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {refId}
                      </span>
                      <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
                        {`Request #${r.id} (${r.status})`}
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
                      {quotesCount > 0 && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: '#FC7C00',
                            background: '#FFF4E6',
                            border: '1px solid #FFE0B2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FiLayers size={12} /> {quotesCount} quote{quotesCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <h2
                      style={{
                        margin: '0 0 10px',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'var(--tf-portal-text-primary, #13291C)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <FiMapPin size={20} style={{ color: '#147D33', flexShrink: 0 }} />
                      <span>{displayName}</span>
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
                      {r.days?.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FiClock size={14} /> {r.days.length} Day Itinerary
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '12px',
                      minWidth: '200px',
                    }}
                  >
                    {r.latestQuotePrice && (
                      <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                        <span style={{ color: '#717D79', display: 'block', fontSize: '0.75rem' }}>Latest Quote</span>
                        <strong style={{ fontSize: '1.15rem', color: '#147D33' }}>
                          {r.latestQuoteCurrency || '$'} {Number(r.latestQuotePrice).toLocaleString()}
                        </strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link to={`/travel-requests/${r.id}`} aria-label={`Open Request ${refId} Workspace`}>
                        <Button
                          variant="primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
                        >
                          <span>Open Workspace</span>
                          <FiArrowRight size={14} />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        title={quotesCount > 0 ? 'Archive request' : 'Delete request'}
                        onClick={() => setRequestToDelete(r)}
                        style={{
                          padding: '9px 12px',
                          color: '#C53030',
                          borderColor: '#FED7D7',
                          background: '#FFF5F5',
                        }}
                      >
                        <FiTrash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete / Archive Confirmation Dialog */}
        {requestToDelete && (
          <ConfirmDialog
            isOpen={Boolean(requestToDelete)}
            title={
              (requestToDelete.quotesCount > 0 || requestToDelete.status !== 'draft')
                ? 'Archive Travel Request?'
                : 'Delete Travel Request?'
            }
            message={
              (requestToDelete.quotesCount > 0 || requestToDelete.status !== 'draft')
                ? `Request "${getTravelRequestDisplayName(requestToDelete)}" (${formatRequestIdentifier(requestToDelete.id)}) has received quotations or has been submitted. It will be safely archived from your active workspace.`
                : `Are you sure you want to permanently delete draft request "${getTravelRequestDisplayName(requestToDelete)}" (${formatRequestIdentifier(requestToDelete.id)})?`
            }
            confirmText={
              deleting
                ? 'Processing…'
                : (requestToDelete.quotesCount > 0 || requestToDelete.status !== 'draft')
                  ? 'Archive Request'
                  : 'Delete Permanently'
            }
            cancelText="Cancel"
            confirmVariant="danger"
            onConfirm={handleDeleteRequest}
            onCancel={() => setRequestToDelete(null)}
          />
        )}
      </main>
    </MotionPage>
  );
}
export default TravelRequestsPage;
