import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrip } from '../features/trip/useTrip.js';
import { useAuth } from '../features/auth/auth-context.js';
import { travelRequestApi, travellerApi } from '../lib/api.js';
import { RoutePlanner } from '../components/RoutePlanner.jsx';
import { RouteSummaryCard } from '../components/RouteSummaryCard.jsx';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';
import { DayPlanner } from '../components/DayPlanner.jsx';
import { RequestReview } from '../components/RequestReview.jsx';
import { WeatherCard } from '../components/WeatherCard.jsx';

import { MotionPage } from '../components/motion/MotionPage.jsx';

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
  const trip = useTrip();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(1);
  const [notice, setNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requestDraftId, setRequestDraftId] = useState(null);

  // Parse URL search params if coming from Public Homepage search
  const queryParams = new URLSearchParams(location.search);
  const paramStartDate = queryParams.get('startDate') || '';
  const paramTravellers = Number(queryParams.get('travellers')) || 2;
  const paramScope = queryParams.get('scope') || 'full_package';

  const [requestForm, setRequestForm] = useState({
    travelStartDate: paramStartDate,
    travelEndDate: '',
    numberOfTravellers: paramTravellers,
    luggageCount: 2,
    accommodationType: '4_star',
    hotelRequired: true,
    guideRequired: false,
    driverRequired: true,
    packageType: paramScope,
    specialRequests: '',
  });

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
      setActiveStep(2);
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
            Plan Your Trip
          </h1>

          {/* Stepper Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              background: '#F7F4EE',
              padding: '8px',
              borderRadius: '12px',
            }}
          >
            {[
              { num: 1, title: '1. Route' },
              { num: 2, title: '2. Details' },
              { num: 3, title: '3. Day Plan' },
              { num: 4, title: '4. Review' },
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
                    padding: '10px 4px',
                    borderRadius: '8px',
                    border: 0,
                    background: isActive ? '#0C4E28' : isCompleted ? '#E5F2EA' : 'transparent',
                    color: isActive ? '#FFFFFF' : isCompleted ? '#0C4E28' : '#66716B',
                    fontWeight: isActive || isCompleted ? '700' : '500',
                    fontSize: '13.5px',
                    cursor: isCompleted ? 'pointer' : 'default',
                    textAlign: 'center',
                  }}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RoutePlanner
              stops={trip.stops}
              onAddStop={trip.addStop}
              onRemoveStop={trip.removeStop}
              onReorderStops={trip.reorderStops}
              onCalculate={handleCalculateRoute}
              calculationStatus={trip.calculationStatus}
              apiError={trip.apiError}
              currentRoute={trip.currentRoute}
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
