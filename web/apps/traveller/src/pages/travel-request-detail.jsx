import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiUserCheck,
  FiTruck,
  FiSend,
  FiXCircle,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiEdit3,
  FiSun,
} from 'react-icons/fi';
import { StatusBadge } from '@troublefree/ui';
import { travelRequestApi, travellerQuotationApi } from '../lib/api.js';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';
import { DayPlanner } from '../components/DayPlanner.jsx';
import { QuotationList } from '../components/QuotationList.jsx';
import { QuotationDetail } from '../components/QuotationDetail.jsx';
import { TravelRequestSummary } from '../components/TravelRequestSummary.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';

const QUOTATION_VISIBLE_STATUSES = ['submitted', 'matching', 'quoted', 'accepted', 'completed'];

export function TravelRequestDetailPage() {
  const { id } = useParams();
  const [draft, setDraft] = useState(null);
  const [days, setDays] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await travelRequestApi.getById(id);
        if (cancelled) return;
        const req = data.request ?? data;
        setDraft(req);
        setDays(req.days ?? []);
        if (QUOTATION_VISIBLE_STATUSES.includes(req.status)) {
          try {
            const q = await travelRequestApi.listQuotations(id);
            if (!cancelled) setQuotations(q.quotations ?? q ?? []);
          } catch {
            // Quotations are supplementary
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load request.');
      }
    })();
    return () => {
      cancelled = true;
    };
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

  async function handleViewQuotation(quotationId) {
    try {
      const data = await travellerQuotationApi.getById(quotationId);
      setSelectedQuotation(data.quotation ?? data);
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

  return (
    <MotionPage>
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', color: '#13291C' }}>
      
      {/* Header Banner */}
      <div
        style={{
          background: '#0C4E28',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(12, 78, 40, 0.2)',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FC7C00', fontWeight: '800' }}>
            Travel Request
          </div>
          <h1 style={{ fontFamily: 'var(--serif, serif)', fontSize: '32px', margin: '4px 0 6px', color: '#FFFFFF' }}>
            Request #{id}
          </h1>
          {draft && (
            <div style={{ fontSize: '14px', color: '#CFE0D5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Request Status:</span>
              <StatusBadge status={draft.status} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isEditable && (
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: '12px 24px',
                background: '#FC7C00',
                color: '#FFFFFF',
                border: 0,
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(252, 124, 0, 0.3)',
              }}
            >
              <FiSend size={16} /> Submit request
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiXCircle size={16} /> Cancel request
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div role="alert" style={{ background: '#FCE8E6', color: '#D93025', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" style={{ background: '#E5F2EA', color: '#0C4E28', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          {notice}
        </div>
      )}

      {/* Details Grid */}
      {draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top 2 Cards: Route & Trip Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Route Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2DCD1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0C4E28', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMapPin /> Route Details
              </h3>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#13291C' }}>
                {route?.startLocation || 'Start'} → {route?.finalDestination || 'Destination'}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#4E5754' }}>
                <span>Distance: <b>{distanceKm} km</b></span>
                <span>Drive: <b>{hours}h {mins}m</b></span>
              </div>
              {route?.stops && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {route.stops.map((s, idx) => (
                    <span key={idx} style={{ fontSize: '12px', background: '#FFFBF3', border: '1px solid #E2DCD1', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                      {s.locationName || s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Travel Specs Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2DCD1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0C4E28', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCalendar /> Travel Details
              </h3>
              <div style={{ fontSize: '14.5px', color: '#13291C' }}>
                Dates: <b>{draft.travelStartDate || 'Flexible'}</b> to <b>{draft.travelEndDate || 'Flexible'}</b>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#4E5754' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiUsers /> <b>{draft.numberOfTravellers}</b> Travellers</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiBriefcase /> <b>{draft.luggageCount}</b> Bags</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {draft.packageType === 'blue_cruise' && (
                  <span style={{ fontSize: '12px', background: '#0C4E28', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                    Blue Cruise {draft.cruiseDuration === '6d_5n' ? '(6 Days / 5 Nights)' : '(4 Days / 3 Nights)'}
                  </span>
                )}
                {draft.hotelRequired && <span style={{ fontSize: '12px', background: '#E5F2EA', color: '#0C4E28', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>Hotel Included</span>}
                {draft.guideRequired && <span style={{ fontSize: '12px', background: '#FFF1DC', color: '#B45A00', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>Tour Guide</span>}
                {draft.driverRequired && <span style={{ fontSize: '12px', background: '#F0F4F8', color: '#1E3A8A', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>Private Driver</span>}
              </div>
            </div>
          </div>

          {/* Edit Form Section (if toggled) */}
          {isEditable && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowEditForm(!showEditForm)}
                style={{ border: '1px solid #D5CDBF', background: '#FFFBF3', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiEdit3 size={15} /> {showEditForm ? 'Hide Edit Form' : 'Edit Request Specs'}
              </button>
            </div>
          )}

          {isEditable && showEditForm && (
            <TravelRequestForm initial={draft} onSubmit={handleUpdate} />
          )}

          {/* Day-by-Day Itinerary Section */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2DCD1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#13291C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiSun style={{ color: '#FC7C00' }} /> Day-by-Day Itinerary ({days.length} Days)
            </h3>

            {days.length === 0 ? (
              <p style={{ color: '#56625B', margin: 0, fontSize: '14px' }}>No day itinerary items planned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {days.map((d, i) => (
                  <div key={d.id || i} style={{ padding: '14px', background: '#FFFBF3', borderRadius: '10px', border: '1px solid #E2DCD1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: '#0C4E28' }}>Day {d.dayNumber || i + 1}: {d.location}</strong>
                      {d.date && <span style={{ fontSize: '12.5px', color: '#66716B' }}>{d.date}</span>}
                    </div>
                    {d.title && <div style={{ fontSize: '14px', fontWeight: '600', color: '#13291C' }}>{d.title}</div>}
                    {d.description && <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#4E5754' }}>{d.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Travel Request Summary for test and accessibility compatibility */}
          <TravelRequestSummary request={draft} />

          {/* Quotations Section (when submitted/matching/quoted/accepted) */}
          {QUOTATION_VISIBLE_STATUSES.includes(draft.status) && (
            <section aria-label="Request quotations" style={{ background: '#FFFFFF', border: '1px solid #E2DCD1', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13291C', margin: '0 0 16px' }}>
                Quotations
              </h2>
              <QuotationList quotations={quotations} />
              {quotations.length > 0 && (
                <ul aria-label="Quotation quick view" style={{ display: 'flex', gap: '10px', listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
                  {quotations.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => handleViewQuotation(q.id)}
                        style={{ padding: '8px 14px', background: '#E5F2EA', color: '#0C4E28', border: '1px solid #147D33', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                      >
                        View quotation #{q.id}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedQuotation && (
                <div style={{ marginTop: '20px' }}>
                  <QuotationDetail quotation={selectedQuotation} />
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </main>
    </MotionPage>
  );
}

export default TravelRequestDetailPage;
