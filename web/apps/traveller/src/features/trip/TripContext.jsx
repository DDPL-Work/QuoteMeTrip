// Trip planning state (Phase 4). React context only — no external store.

import { useCallback, useMemo, useState } from 'react';
import { routeApi } from '../../lib/api.js';
import { TripContext } from './trip-context.js';

let stopSeq = 1;

export function TripProvider({ children, routeClient = routeApi } = {}) {
  const [stops, setStops] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [calculationStatus, setCalculationStatus] = useState('idle');
  const [recommendedDays, setRecommendedDays] = useState(null);
  const [overriddenDays, setOverriddenDays] = useState(null);
  const [requestDraft, setRequestDraft] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [submissionState, setSubmissionState] = useState('idle');
  const [apiError, setApiError] = useState(null);

  const [isStale, setIsStale] = useState(false);

  const addStop = useCallback((stop) => {
    setStops((prev) => {
      // Auto-assign start/final type if needed
      let nextType = stop.type;
      if (prev.length === 0) {
        nextType = 'start';
      }
      return [...prev, { ...stop, type: nextType, id: stop.id ?? `stop-${stopSeq++}` }];
    });
    setIsStale(true);
  }, []);

  const removeStop = useCallback((id) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    setIsStale(true);
  }, []);

  const reorderStops = useCallback((fromIndex, toIndex) => {
    setStops((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length)
        return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setIsStale(true);
  }, []);

  const calculateRoute = useCallback(async () => {
    setCalculationStatus('calculating');
    setApiError(null);
    try {
      const payload = {
        stops: stops.map(({ name, latitude, longitude, type, placeId }) => ({
          name,
          latitude,
          longitude,
          type,
          placeId: placeId || null,
        })),
      };
      const result = await routeClient.calculate(payload);
      setCurrentRoute(result.route ?? result);
      setRecommendedDays(result.recommendedDays ?? result.route?.recommendedDays ?? null);
      setCalculationStatus('calculated');
      setIsStale(false);
      return result;
    } catch (error) {
      setApiError(error?.message ?? 'Route calculation failed.');
      setCalculationStatus('error');
      throw error;
    }
  }, [stops, routeClient]);

  const saveRoute = useCallback(
    async (input = {}) => {
      const saved = await routeClient.create({
        stops: stops.map(({ name, latitude, longitude, type, placeId }) => ({
          name,
          latitude,
          longitude,
          type,
          placeId: placeId || null,
        })),
        ...input,
      });
      setCurrentRoute(saved.route ?? saved);
      setIsStale(false);
      return saved;
    },
    [stops, routeClient],
  );

  const clearRoute = useCallback(() => {
    setStops([]);
    setCurrentRoute(null);
    setCalculationStatus('idle');
    setIsStale(false);
    setRecommendedDays(null);
    setOverriddenDays(null);
    setApiError(null);
  }, []);

  const value = useMemo(
    () => ({
      stops,
      currentRoute,
      calculationStatus,
      recommendedDays,
      overriddenDays,
      requestDraft,
      requestLoading,
      submissionState,
      apiError,
      isStale,
      addStop,
      removeStop,
      reorderStops,
      calculateRoute,
      saveRoute,
      clearRoute,
      setIsStale,
      setOverriddenDays,
      setRequestDraft,
      setRequestLoading,
      setSubmissionState,
      setApiError,
    }),
    [
      stops,
      currentRoute,
      calculationStatus,
      recommendedDays,
      overriddenDays,
      requestDraft,
      requestLoading,
      submissionState,
      apiError,
      isStale,
      addStop,
      removeStop,
      reorderStops,
      calculateRoute,
      saveRoute,
      clearRoute,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
