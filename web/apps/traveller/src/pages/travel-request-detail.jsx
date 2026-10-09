import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiSend,
  FiXCircle,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiEdit3,
  FiSun,
  FiLayers,
  FiMessageSquare,
  FiTrash2,
  FiChevronRight,
  FiInfo,
  FiCompass,
} from 'react-icons/fi';
import {
  StatusBadge,
  Button,
  ConfirmDialog,
  toast,
  getTravelRequestDisplayName,
  formatRequestIdentifier,
} from '@troublefree/ui';
import { travelRequestApi, travellerQuotationApi } from '../lib/api.js';
import { useAuth } from '../features/auth/auth-context.js';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';
import { QuotationList } from '../components/QuotationList.jsx';
import { QuotationDetail } from '../components/QuotationDetail.jsx';
import { TravelRequestSummary } from '../components/TravelRequestSummary.jsx';
import { WeatherCard } from '../components/WeatherCard.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';
import { ChatWorkspace } from '../components/ChatWorkspace.jsx';
import { JobDetailView } from '../components/Phase6.jsx';

const QUOTATION_VISIBLE_STATUSES = ['submitted', 'matching', 'quoted', 'accepted', 'completed'];

export function TravelRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [draft, setDraft] = useState(null);
  const [days, setDays] = useState([]);
  const [error, setErrorState] = useState(null);
  const [notice, setNoticeState] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, quotes, messages, itinerary, job
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setError = (msg) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };

  const setNotice = (msg) => {
    setNoticeState(msg);
    if (msg) toast.success(msg);
  };

  const loadData = async () => {
    try {
      const data = await travelRequestApi.getById(id);
      const req = data.request ?? data;
      setDraft(req);
      setDays(req.days ?? []);

      if (QUOTATION_VISIBLE_STATUSES.includes(req.status)) {
        try {
          const q = await travelRequestApi.listQuotations(id);
          const qList = q.quotations ?? q ?? [];
          setQuotations(qList);
        } catch {
          // Quotations are supplementary
        }
      }
    } catch (e) {
      setError(e?.message ?? 'Failed to load request.');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleUpdate(form) {
    setNotice(null);
    try {
      const updated = await travelRequestApi.update(id, form);
      const req = updated.request ?? updated;
      setDraft(req);
      setNotice('Draft saved.');
      setShowEditForm(false);
    } catch (e) {
      setError(e?.message ?? 'Failed to update request.');
    }
  }

  async function handleSubmit() {
    try {
      const updated = await travelRequestApi.submit(id);
      const req = updated.request ?? updated;
      setDraft(req);
      setNotice('Request submitted.');
    } catch (e) {
      setError(e?.message ?? 'Failed to submit request.');
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this travel request?')) return;
    try {
      const updated = await travelRequestApi.cancel(id);
      const req = updated.request ?? updated;
      setDraft(req);
      setNotice('Request cancelled.');
    } catch (e) {
      setError(e?.message ?? 'Failed to cancel request.');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await travelRequestApi.delete(id);
      toast.success(res?.archived ? 'Travel request archived.' : 'Draft travel request deleted.');
      navigate('/travel-requests');
    } catch (e) {
      toast.error(e?.message ?? 'Failed to delete request.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleViewQuotation(quotationId) {
    try {
      const data = await travellerQuotationApi.getById(quotationId);
      setSelectedQuotation(data.quotation ?? data);
      setActiveTab('quotes');
    } catch (e) {
      setError(e?.message ?? 'Failed to load quotation.');
    }
  }

  const route = draft?.route || null;
  const distanceKm = route?.totalDistanceKm ?? route?.distanceKm ?? 0;
  const durationMins = route?.estimatedDurationMinutes ?? route?.durationMinutes ?? 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  const isEditable = draft?.status === 'draft';
  const canCancel = draft?.status === 'draft' || draft?.status === 'submitted';
  const hasJob = Boolean(draft?.job || draft?.status === 'accepted' || draft?.status === 'job_created');
  const quotesCount = quotations.length || draft?.quotesCount || 0;
  const displayName = draft ? getTravelRequestDisplayName(draft) : `Request #${id}`;
  const refId = formatRequestIdentifier(id);
  const renderQuotationsContent = () => (
    <section
      aria-label="Request quotations"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2DCD1',
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#13291C',
              margin: 0,
            }}
          >
            Quotations
          </h2>
          <p style={{ margin: '4px 0 0', color: '#56625B', fontSize: '14px' }}>
            Compare official proposals and customized itineraries from verified travel agencies.
          </p>
        </div>
        {quotations.length > 1 && (
          <Link to={`/travel-requests/${id}/comparison`}>
            <Button variant="outline" style={{ fontSize: '0.88rem' }}>
              Compare All ({quotations.length}) Side-by-Side
            </Button>
          </Link>
        )}
      </div>

      <QuotationList quotations={quotations} />

      {quotations.length > 0 && (
        <ul
          aria-label="Quotation quick view"
          style={{
            display: 'flex',
            gap: '10px',
            listStyle: 'none',
            padding: 0,
            margin: '16px 0 0',
            flexWrap: 'wrap',
          }}
        >
          {quotations.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => handleViewQuotation(q.id)}
                style={{
                  padding: '8px 14px',
                  background: selectedQuotation?.id === q.id ? '#147D33' : '#E5F2EA',
                  color: selectedQuotation?.id === q.id ? '#FFFFFF' : '#0C4E28',
                  border: '1px solid #147D33',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                View quotation #{q.id}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedQuotation && (
        <div style={{ marginTop: '24px' }}>
          <QuotationDetail quotation={selectedQuotation} />
        </div>
      )}
    </section>
  );

  return (
    <MotionPage>
      <main
        style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px', color: '#13291C' }}
        aria-label="Travel Request Workspace"
      >
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.9rem', color: '#66716B' }}>
          <Link to="/travel-requests" style={{ color: '#147D33', textDecoration: 'none', fontWeight: 600 }}>
            Travel Requests
          </Link>
          <FiChevronRight size={14} />
          <span style={{ color: '#13291C', fontWeight: 600 }}>{refId}</span>
          <span style={{ color: '#9CA3AF' }}>•</span>
          <span style={{ color: '#4E5754' }}>{displayName}</span>
        </div>

        {/* Header Workspace Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 8px 24px rgba(12, 78, 40, 0.18)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  letterSpacing: '0.5px',
                  color: '#FC7C00',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  background: 'rgba(252, 124, 0, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {refId}
              </span>
              {draft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <StatusBadge status={draft.status} />
                </div>
              )}
            </div>

            <h1
              style={{
                fontFamily: 'var(--serif, serif)',
                fontSize: '2rem',
                margin: '2px 0 8px',
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              {displayName}
            </h1>

            {draft && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.88rem', color: '#CFE0D5' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FiCalendar size={14} /> {draft.travelStartDate || 'Flexible'} — {draft.travelEndDate || 'Flexible'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FiUsers size={14} /> {draft.numberOfTravellers || 1} Travellers
                </span>
                {draft.packageType && (
                  <span style={{ textTransform: 'capitalize' }}>
                    Type: {draft.packageType.replace('_', ' ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isEditable && (
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  padding: '11px 22px',
                  background: '#FC7C00',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(252, 124, 0, 0.3)',
                }}
              >
                <FiSend size={15} /> Submit request
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiXCircle size={15} /> Cancel request
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title={quotesCount > 0 ? 'Archive request' : 'Delete request'}
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#FECACA',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        </div>

        {/* Global Alerts */}
        {error && (
          <div
            role="alert"
            style={{
              background: '#FCE8E6',
              color: '#D93025',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            style={{
              background: '#E5F2EA',
              color: '#0C4E28',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {notice}
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #E2DCD1',
            marginBottom: '24px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              fontSize: '0.95rem',
              color: activeTab === 'overview' ? '#147D33' : '#56625B',
              borderBottom: activeTab === 'overview' ? '3px solid #147D33' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiCompass size={16} /> Overview & Specs
          </button>

          {QUOTATION_VISIBLE_STATUSES.includes(draft?.status) && (
            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'quotes' ? 700 : 500,
                fontSize: '0.95rem',
                color: activeTab === 'quotes' ? '#147D33' : '#56625B',
                borderBottom: activeTab === 'quotes' ? '3px solid #147D33' : '3px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiLayers size={16} /> All Quotes ({quotesCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'messages' ? 700 : 500,
              fontSize: '0.95rem',
              color: activeTab === 'messages' ? '#147D33' : '#56625B',
              borderBottom: activeTab === 'messages' ? '3px solid #147D33' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiMessageSquare size={16} /> Messages
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'itinerary' ? 700 : 500,
              fontSize: '0.95rem',
              color: activeTab === 'itinerary' ? '#147D33' : '#56625B',
              borderBottom: activeTab === 'itinerary' ? '3px solid #147D33' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiSun size={16} /> Itinerary ({days.length} Days)
          </button>

          {hasJob && (
            <button
              type="button"
              onClick={() => setActiveTab('job')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'job' ? 700 : 500,
                fontSize: '0.95rem',
                color: activeTab === 'job' ? '#0C4E28' : '#56625B',
                borderBottom: activeTab === 'job' ? '3px solid #0C4E28' : '3px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiCheckCircle size={16} style={{ color: '#147D33' }} /> Active Booking / Job
            </button>
          )}
        </div>

        {/* Tab 1: Overview & Specs */}
        {activeTab === 'overview' && draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Weather Card */}
            <WeatherCard
              destination={route?.finalDestination || route?.startLocation || ''}
              stops={route?.stops || []}
              date={draft?.travelStartDate || ''}
              title="Destination Weather Forecast"
            />

            {/* Top 2 Cards: Route & Trip Specs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Route Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2DCD1',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#0C4E28',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiMapPin /> Route Details
                </h3>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#13291C' }}>
                  {route?.startLocation || 'Start'} → {route?.finalDestination || 'Destination'}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#4E5754' }}>
                  <span>
                    Distance: <b>{distanceKm} km</b>
                  </span>
                  <span>
                    Drive:{' '}
                    <b>
                      {hours}h {mins}m
                    </b>
                  </span>
                </div>
                {route?.stops && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {route.stops.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '12px',
                          background: '#FFFBF3',
                          border: '1px solid #E2DCD1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: '600',
                        }}
                      >
                        {s.locationName || s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Travel Specs Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2DCD1',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#0C4E28',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiCalendar /> Travel Details
                </h3>
                <div style={{ fontSize: '14.5px', color: '#13291C' }}>
                  Dates: <b>{draft.travelStartDate || 'Flexible'}</b> to{' '}
                  <b>{draft.travelEndDate || 'Flexible'}</b>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#4E5754' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiUsers /> <b>{draft.numberOfTravellers}</b> Travellers
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiBriefcase /> <b>{draft.luggageCount}</b> Bags
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {draft.packageType === 'blue_cruise' && (
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#0C4E28',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '700',
                      }}
                    >
                      Blue Cruise{' '}
                      {draft.cruiseDuration === '6d_5n'
                        ? '(6 Days / 5 Nights)'
                        : '(4 Days / 3 Nights)'}
                    </span>
                  )}
                  {draft.hotelRequired && (
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#E5F2EA',
                        color: '#0C4E28',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                      }}
                    >
                      Hotel Included
                    </span>
                  )}
                  {draft.guideRequired && (
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#FFF1DC',
                        color: '#B45A00',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                      }}
                    >
                      Tour Guide
                    </span>
                  )}
                  {draft.driverRequired && (
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#F0F4F8',
                        color: '#1E3A8A',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                      }}
                    >
                      Private Driver
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Form Toggle (if draft) */}
            {isEditable && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditForm(!showEditForm)}
                  style={{
                    border: '1px solid #D5CDBF',
                    background: '#FFFBF3',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FiEdit3 size={15} /> {showEditForm ? 'Hide Edit Form' : 'Edit Request Specs'}
                </button>
              </div>
            )}

            {isEditable && showEditForm && (
              <TravelRequestForm initial={draft} onSubmit={handleUpdate} />
            )}

            {/* Travel Request Summary for test and accessibility compatibility */}
            <TravelRequestSummary request={draft} />

            {/* Quotations on Overview if visible */}
            {QUOTATION_VISIBLE_STATUSES.includes(draft?.status) && renderQuotationsContent()}
          </div>
        )}

        {/* Tab 2: All Quotes */}
        {activeTab === 'quotes' && QUOTATION_VISIBLE_STATUSES.includes(draft?.status) && renderQuotationsContent()}

        {/* Tab 3: Messages */}
        {activeTab === 'messages' && (
          <section
            aria-label="Request contextual messages"
            style={{
              height: '680px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <ChatWorkspace
              currentUserId={user?.id}
              currentUserRole="traveller"
              travelRequestId={id}
            />
          </section>
        )}

        {/* Tab 4: Itinerary */}
        {activeTab === 'itinerary' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2DCD1',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#13291C',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiSun style={{ color: '#FC7C00' }} /> Day-by-Day Itinerary ({days.length} Days)
            </h3>

            {days.length === 0 ? (
              <p style={{ color: '#56625B', margin: 0, fontSize: '14px' }}>
                No day itinerary items planned yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {days.map((d, i) => (
                  <div
                    key={d.id || i}
                    style={{
                      padding: '16px 20px',
                      background: '#FFFBF3',
                      borderRadius: '12px',
                      border: '1px solid #E2DCD1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '15px', color: '#0C4E28' }}>
                        Day {d.dayNumber || i + 1}: {d.location}
                      </strong>
                      {d.date && (
                        <span style={{ fontSize: '13px', color: '#66716B' }}>{d.date}</span>
                      )}
                    </div>
                    {d.title && (
                      <div style={{ fontSize: '14.5px', fontWeight: '600', color: '#13291C' }}>
                        {d.title}
                      </div>
                    )}
                    {d.description && (
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#4E5754' }}>
                        {d.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Job / Active Booking */}
        {activeTab === 'job' && hasJob && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2DCD1',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <JobDetailView job={draft?.job} />
          </div>
        )}

        {/* Delete / Archive Confirmation Dialog */}
        {showDeleteConfirm && (
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title={
              (quotesCount > 0 || draft?.status !== 'draft')
                ? 'Archive Travel Request?'
                : 'Delete Travel Request?'
            }
            message={
              (quotesCount > 0 || draft?.status !== 'draft')
                ? `Request "${displayName}" (${refId}) has received quotations or has been submitted. It will be safely archived from your active workspace.`
                : `Are you sure you want to permanently delete draft request "${displayName}" (${refId})?`
            }
            confirmText={
              deleting
                ? 'Processing…'
                : (quotesCount > 0 || draft?.status !== 'draft')
                  ? 'Archive Request'
                  : 'Delete Permanently'
            }
            cancelText="Cancel"
            confirmVariant="danger"
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </main>
    </MotionPage>
  );
}

export default TravelRequestDetailPage;
