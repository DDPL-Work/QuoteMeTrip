import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../features/trip/useTrip.js';
import { travelRequestApi } from '../lib/api.js';
import { LocationSelector } from '../components/LocationSelector.jsx';
import { RouteStopList } from '../components/RouteStopList.jsx';
import { RouteMap } from '../components/RouteMap.jsx';
import { RouteSummary } from '../components/RouteSummary.jsx';
import { RecommendedDays } from '../components/RecommendedDays.jsx';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';

export function PlanTripPage() {
  const trip = useTrip();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);

  async function handleCalculate() {
    try {
      await trip.calculateRoute();
    } catch {
      // apiError already set in context.
    }
  }

  async function handleCreateRequest(form) {
    setNotice(null);
    trip.setRequestLoading(true);
    try {
      const saved = await trip.saveRoute({});
      const routeId = saved.route?.id ?? saved.id;
      const created = await travelRequestApi.create({
        routeId,
        ...form,
        numberOfTravellers: Number(form.numberOfTravellers),
        luggageCount: Number(form.luggageCount),
      });
      const req = created.request ?? created;
      trip.setRequestDraft(req);
      trip.setSubmissionState('draft');
      navigate(`/travel-requests/${req.id}`);
    } catch (e) {
      setNotice(e?.message ?? 'Failed to create request.');
    } finally {
      trip.setRequestLoading(false);
    }
  }

  return (
    <main>
      <h1>Plan trip</h1>
      {trip.apiError && <p role="alert">{trip.apiError}</p>}
      {notice && <p role="alert">{notice}</p>}
      <LocationSelector onAdd={trip.addStop} />
      <RouteStopList stops={trip.stops} onRemove={trip.removeStop} onMove={trip.reorderStops} />
      <button
        type="button"
        onClick={handleCalculate}
        disabled={trip.stops.length < 2 || trip.calculationStatus === 'calculating'}
      >
        {trip.calculationStatus === 'calculating' ? 'Calculating…' : 'Calculate route'}
      </button>
      <p>Status: {trip.calculationStatus}</p>
      <RouteMap stops={trip.stops} geometry={trip.currentRoute?.geometry} />
      <RouteSummary route={trip.currentRoute} />
      <RecommendedDays
        recommended={trip.recommendedDays}
        overridden={trip.overriddenDays}
        onOverride={trip.setOverriddenDays}
      />
      {trip.calculationStatus === 'calculated' && (
        <TravelRequestForm onSubmit={handleCreateRequest} submitting={trip.requestLoading} />
      )}
    </main>
  );
}
