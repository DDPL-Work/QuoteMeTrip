import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { useTrip } from '../features/trip/useTrip.js';
import { useAuth } from '../features/auth/auth-context.js';
import { travelRequestApi, travellerApi } from '../lib/api.js';
import { parseSearchParams, scopeToLabel } from '../features/trip/search-trip-mapping.js';
import { RoutePlanner } from '../components/RoutePlanner.jsx';
import { RouteSummaryCard } from '../components/RouteSummaryCard.jsx';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';
import { DayPlanner } from '../components/DayPlanner.jsx';
import { RequestReview } from '../components/RequestReview.jsx';
import { WeatherCard } from '../components/WeatherCard.jsx';
import { FiMapPin, FiCalendar, FiClock, FiUsers, FiTag, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

import { MotionPage } from '../components/motion/MotionPage.jsx';
import { toast } from '../components/feedback/ToastProvider.jsx';

/**
 * PlanTripPage (Phase 4 — Route-First Master Planning Engine)
 *
 * Flow:
 * 1. Step 1: Design & Calculate Route
 * 2. Step 2: Trip Details & Preferences
 * 3. Step 3: Day-by-Day Itinerary Planning
 * 4. Step 4: Final Review & Submission
 */
export function PlanTripPage() {
  const { t } = useI18n();
  const trip = useTrip();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(1);
  const [notice, setNoticeState] = useState(null);
  const [errorNotice, setErrorNoticeState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requestDraftId, setRequestDraftId] = useState(null);

  const setNotice = (msg) => {
    setNoticeState(msg);
    if (msg) toast.success(msg);
  };

  const setErrorNotice = (msg) => {
    setErrorNoticeState(msg);
    if (msg) toast.error(msg);
  };

  // Parse & validate URL search params from Public Homepage search
  const initialSearchState = useMemo(() => {
    return parseSearchParams(location.search);
  }, [location.search]);

  const [requestForm, setRequestForm] = useState(() => ({
    destinationCountry: initialSearchState.country,
    travelStartDate: initialSearchState.startDate,
    travelEndDate: initialSearchState.travelEndDate,
    chosenDuration: initialSearchState.days,
    numberOfTravellers: initialSearchState.travellers,
    luggageCount: Math.max(1, initialSearchState.travellers),
    accommodationType: '4_star',
    hotelRequired: initialSearchState.hotelRequired,
    guideRequired: initialSearchState.guideRequired,
    driverRequired: initialSearchState.driverRequired,
    packageType: initialSearchState.scope,
    cruiseDuration: initialSearchState.cruiseDuration,
    isFlexibleDates: initialSearchState.flexible,
    suggestRoute: initialSearchState.suggest,
    specialRequests: '',
  }));

  // Synchronize search params to TripContext once on mount or URL change
  useEffect(() => {
    if (initialSearchState.country && trip.setDestinationCountry) {
      trip.setDestinationCountry(initialSearchState.country);
    }
    if (initialSearchState.suggest !== undefined && trip.setSuggestRoute) {
      trip.setSuggestRoute(initialSearchState.suggest);
    }
    if (initialSearchState.flexible !== undefined && trip.setIsFlexibleDates) {
      trip.setIsFlexibleDates(initialSearchState.flexible);
    }
    if (initialSearchState.scope && trip.setPackageScope) {
      trip.setPackageScope(initialSearchState.scope);
    }
    if (initialSearchState.days && trip.setOverriddenDays && !trip.overriddenDays) {
      trip.setOverriddenDays(initialSearchState.days);
    }
  }, [initialSearchState, trip]);

  const [days, setDays] = useState([]);

  // Fetch traveller profile info on mount for autofill
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await travellerApi.me();
        if (active && res.user) {
          setProfile(res.user);
        }
      } catch {
        // Fallback to auth user
        if (active && user) setProfile(user);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Step 1: Calculate Route
  async function handleCalculateRoute() {
    setErrorNotice(null);
    try {
      await trip.calculateRoute();
    } catch (e) {
      setErrorNotice(e?.message ?? 'Route calculation failed.');
    }
  }

  // Step 2: Save Route & Create/Update Request Draft
  async function handleSaveTripDetails(formData) {
    setErrorNotice(null);
    setNotice(null);
    trip.setRequestLoading(true);
    try {
      let routeId = trip.currentRoute?.id;
      if (!routeId) {
        const savedRoute = await trip.saveRoute({});
        routeId = savedRoute.route?.id ?? savedRoute.id;
      }

      const payload = {
        routeId,
        ...formData,
        numberOfTravellers: Number(formData.numberOfTravellers),
        luggageCount: Number(formData.luggageCount),
      };

      let req;
      if (!requestDraftId) {
        const created = await travelRequestApi.create(payload);
        req = created.request ?? created;
        setRequestDraftId(req.id);
        trip.setRequestDraft(req);
      } else {
        const updated = await travelRequestApi.update(requestDraftId, payload);
        req = updated.request ?? updated;
        trip.setRequestDraft(req);
      }

      setRequestForm(formData);
      setDays(req.days ?? []);
      setActiveStep(3);
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to save travel details.');
    } finally {
      trip.setRequestLoading(false);
    }
  }

  // Step 3 Day Operations
  async function handleAddDay(dayInput) {
    if (!requestDraftId) return;
    try {
      const created = await travelRequestApi.addDay(requestDraftId, dayInput);
      const newDay = created.day ?? created;
      setDays((prev) => [...prev, newDay]);
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to add day.');
    }
  }

  async function handleUpdateDay(dayId, dayInput) {
    if (!requestDraftId) return;
    try {
      const updated = await travelRequestApi.updateDay(requestDraftId, dayId, dayInput);
      const d = updated.day ?? updated;
      setDays((prev) => prev.map((x) => (x.id === dayId || x.dayNumber === dayId ? d : x)));
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to update day.');
    }
  }

  async function handleDeleteDay(dayId) {
    if (!requestDraftId) return;
    try {
      await travelRequestApi.deleteDay(requestDraftId, dayId);
      setDays((prev) => prev.filter((x) => x.id !== dayId && x.dayNumber !== dayId));
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to delete day.');
    }
  }

  // Step 4: Final Submission
  async function handleSubmitRequest() {
    if (!requestDraftId) return;
    setErrorNotice(null);
    trip.setRequestLoading(true);
    try {
      const result = await travelRequestApi.submit(requestDraftId);
      const req = result.request ?? result;
      trip.setRequestDraft(req);
      trip.setSubmissionState('submitted');
      navigate(`/travel-requests/${req.id}`);
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to submit request.');
    } finally {
      trip.setRequestLoading(false);
    }
  }

  // Manual Save Draft
  async function handleSaveDraft() {
    if (!requestDraftId) return;
    try {
      await travelRequestApi.update(requestDraftId, requestForm);
      setNotice('Draft saved successfully.');
    } catch (e) {
      setErrorNotice(e?.message ?? 'Failed to save draft.');
    }
  }

  return (
    <MotionPage>
      <main
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', color: '#13291C' }}
      >
        {/* Page Title & Progress Stepper */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontFamily: 'var(--serif, serif)',
              fontSize: '32px',
              margin: '0 0 16px',
              color: '#0C4E28',
            }}
          >
            {t('planTrip.title', 'Plan Your Trip')}
          </h1>

          {/* Stepper Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '6px',
              background: '#F7F4EE',
              padding: '6px',
              borderRadius: '12px',
              overflowX: 'auto',
            }}
          >
            {[
              { num: 1, title: t('planTrip.step1', 'Route'), fullTitle: `1. ${t('planTrip.step1', 'Route')}` },
              { num: 2, title: t('planTrip.step2', 'Details'), fullTitle: `2. ${t('planTrip.step2', 'Details')}` },
              { num: 3, title: t('planTrip.step3', 'Day Plan'), fullTitle: `3. ${t('planTrip.step3', 'Day Plan')}` },
              { num: 4, title: t('planTrip.step4', 'Review'), fullTitle: `4. ${t('planTrip.step4', 'Review')}` },
            ].map((s) => {
              const isActive = activeStep === s.num;
              const isCompleted = activeStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => isCompleted && setActiveStep(s.num)}
                  disabled={!isCompleted && !isActive}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 0,
                    background: isActive ? '#0C4E28' : isCompleted ? '#E5F2EA' : 'transparent',
                    color: isActive ? '#FFFFFF' : isCompleted ? '#0C4E28' : '#66716B',
                    fontWeight: isActive || isCompleted ? '700' : '500',
                    fontSize: 'clamp(11px, 2.8vw, 13.5px)',
                    cursor: isCompleted ? 'pointer' : 'default',
                    textAlign: 'center',
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                  title={s.fullTitle}
                >
                  <span className="tf-hide-under-400">{s.num}. </span>{s.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Preferences Summary Strip */}
        {Boolean(initialSearchState.country || initialSearchState.startDate || initialSearchState.days) && (
          <div
            data-testid="search-preferences-strip"
            style={{
              marginBottom: '20px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F0F7F2 0%, #FFFBF3 100%)',
              border: '1px solid #D5E7DB',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px 16px',
                fontSize: '13.5px',
                color: '#13291C',
              }}
            >
              <span
                style={{
                  fontWeight: '700',
                  color: '#0C4E28',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiCheckCircle size={16} /> {t('planTrip.searchPrefApplied', 'Search Prefilled:')}
              </span>
              {initialSearchState.scope && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#0C4E28',
                    color: '#FFF',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '12px',
                  }}
                >
                  <FiTag size={12} /> {scopeToLabel(initialSearchState.scope)}
                </span>
              )}
              {initialSearchState.country && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <FiMapPin size={14} color="#0C4E28" /> {initialSearchState.country}
                </span>
              )}
              {initialSearchState.startDate && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiCalendar size={14} color="#0C4E28" /> {initialSearchState.startDate}
                  {initialSearchState.flexible ? ` (${t('planTrip.flexible', '±3 days flexible')})` : ''}
                </span>
              )}
              {initialSearchState.days && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiClock size={14} color="#0C4E28" /> {initialSearchState.days} {t('planTrip.days', 'Days')}
                </span>
              )}
              {initialSearchState.travellers && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiUsers size={14} color="#0C4E28" /> {initialSearchState.travellers} {t('planTrip.travellers', 'Travellers')}
                </span>
              )}
              {initialSearchState.suggest && (
                <span
                  style={{
                    background: '#FFF3E0',
                    color: '#E65100',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '12px',
                    border: '1px solid #FFE0B2',
                  }}
                >
                  {t('planTrip.agencySuggestRoute', 'Agencies Suggest Route')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Global Alerts */}
        {(trip.apiError || errorNotice) && (
          <div
            role="alert"
            style={{
              background: '#FCE8E6',
              color: '#D93025',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {trip.apiError || errorNotice}
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
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {notice}
          </div>
        )}

        {/* STEP 1: Route Planner */}
        {activeStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {requestForm.suggestRoute && (
              <div
                data-testid="suggest-route-banner"
                style={{
                  padding: '14px 18px',
                  background: '#FFF9E6',
                  border: '1px solid #FFE082',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🧭</span>
                  <div>
                    <div style={{ fontWeight: '700', color: '#8D6E63', fontSize: '13.5px' }}>
                      {t('planTrip.agencySuggestRouteTitle', 'Letting agencies suggest the route')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#5D4037' }}>
                      {t(
                        'planTrip.agencySuggestRouteDesc',
                        'You can customize stops on the map below, or jump directly to Trip Details & Services.'
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#0C4E28',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {t('planTrip.skipToStep2', 'Skip to Trip Details (Step 2)')} <FiArrowRight size={14} />
                </button>
              </div>
            )}
            <RoutePlanner
              stops={trip.stops}
              travelMode={trip.travelMode}
              onSelectTravelMode={trip.setTravelMode}
              onAddStop={trip.addStop}
              onRemoveStop={trip.removeStop}
              onReorderStops={trip.reorderStops}
              onCalculate={handleCalculateRoute}
              onAdvanceStep={() => setActiveStep(2)}
              onClearRoute={trip.clearRoute}
              calculationStatus={trip.calculationStatus}
              isStale={trip.isStale}
              apiError={trip.apiError}
              currentRoute={trip.currentRoute}
              recommendedDays={trip.recommendedDays}
            />
            {trip.stops && trip.stops.length > 0 && (
              <WeatherCard
                stops={trip.stops}
                date={requestForm.travelStartDate}
                title="Destination Weather Preview"
              />
            )}
          </div>
        )}

        {/* STEP 2: Trip Details & Services */}
        {activeStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RouteSummaryCard
              route={trip.currentRoute}
              recommendedDays={trip.recommendedDays}
              overriddenDays={trip.overriddenDays}
              onOverrideDays={trip.setOverriddenDays}
            />
            <WeatherCard
              stops={trip.stops}
              date={requestForm.travelStartDate}
              title="Travel Date Weather Forecast"
            />
            <TravelRequestForm
              initial={requestForm}
              onSubmit={handleSaveTripDetails}
              submitting={trip.requestLoading}
              submitButtonLabel="Continue to Day Plan →"
            />
          </div>
        )}

        {/* STEP 3: Day-by-Day Planning */}
        {activeStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <WeatherCard
              stops={trip.stops}
              date={requestForm.travelStartDate}
              title="Itinerary Weather Overview"
              compact
            />
            <DayPlanner
              days={days}
              onAddDay={handleAddDay}
              onUpdateDay={handleUpdateDay}
              onDeleteDay={handleDeleteDay}
              targetDuration={trip.overriddenDays || trip.recommendedDays || 3}
              stops={trip.stops}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid #D5CDBF',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ← Back to Details
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 0,
                  background: '#FC7C00',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '15px',
                }}
              >
                Next: Review & Submit →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Final Review & Submit */}
        {activeStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <WeatherCard
              stops={trip.stops}
              date={requestForm.travelStartDate}
              title="Destination Forecast Summary"
            />
            <RequestReview
              route={trip.currentRoute}
              form={requestForm}
              days={days}
              profile={profile}
              onSubmit={handleSubmitRequest}
              onSaveDraft={handleSaveDraft}
              submitting={trip.requestLoading}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid #D5CDBF',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ← Back to Day Plan
              </button>
            </div>
          </div>
        )}
      </main>
    </MotionPage>
  );
}

export default PlanTripPage;
