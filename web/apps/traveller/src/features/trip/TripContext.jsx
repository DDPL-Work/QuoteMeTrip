// Trip planning state (Phase 4). React context only — no external store.

import { useCallback, useMemo, useRef, useState } from 'react';
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

  const [travelMode, setTravelModeState] = useState('DRIVE');
  const [isStale, setIsStale] = useState(false);
  const [destinationCountry, setDestinationCountry] = useState('Türkiye');
  const [suggestRoute, setSuggestRoute] = useState(false);
  const [isFlexibleDates, setIsFlexibleDates] = useState(false);
  const [packageScope, setPackageScope] = useState('full_package');

  // Track request IDs to prevent stale responses from overwriting newer calculations
  const calcReqRef = useRef(0);

  const calculateRoute = useCallback(
    async (modeOverride) => {
      const targetMode =
        typeof modeOverride === 'string' && modeOverride.trim()
          ? modeOverride.trim().toUpperCase()
          : (travelMode || 'DRIVE').toUpperCase();

      const reqId = ++calcReqRef.current;
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
          travelMode: targetMode,
        };
        const result = await routeClient.calculate(payload);

        // Guard against stale async responses overwriting newer requests
        if (reqId !== calcReqRef.current) {
          return result;
        }

        const calculatedRoute = result.route ?? result;
        setCurrentRoute({ ...calculatedRoute, travelMode: calculatedRoute.travelMode || targetMode });
        setRecommendedDays(result.recommendedDays ?? result.route?.recommendedDays ?? null);
        setCalculationStatus('calculated');
        setIsStale(false);
        return result;
      } catch (error) {
        if (reqId !== calcReqRef.current) {
          return;
        }
        setApiError(error?.message ?? 'Route calculation failed.');
        setCalculationStatus('error');
        setCurrentRoute(null);
        setIsStale(true);
        throw error;
      }
    },
    [stops, travelMode, routeClient],
  );

  const setTravelMode = useCallback(
    (mode) => {
      const next = typeof mode === 'string' && mode.trim() ? mode.trim().toUpperCase() : 'DRIVE';
      setTravelModeState(next);
      setIsStale(true);

      // Auto-recalculate if at least 2 stops are configured and a route has been calculated or exists
      if (stops.length >= 2 && (calculationStatus === 'calculated' || currentRoute)) {
        calculateRoute(next).catch(() => {});
      }
    },
    [stops, calculationStatus, currentRoute, calculateRoute],
  );

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
        travelMode,
        ...input,
      });
      setCurrentRoute(saved.route ?? saved);
      setIsStale(false);
      return saved;
    },
    [stops, travelMode, routeClient],
  );

  const clearRoute = useCallback(() => {
    calcReqRef.current++;
    setStops([]);
    setCurrentRoute(null);
    setTravelModeState('DRIVE');
    setCalculationStatus('idle');
    setIsStale(false);
    setRecommendedDays(null);
    setOverriddenDays(null);
    setApiError(null);
  }, []);

  const value = useMemo(
    () => ({
      stops,
      travelMode,
      setTravelMode,
      currentRoute,
      calculationStatus,
      recommendedDays,
      overriddenDays,
      requestDraft,
      requestLoading,
      submissionState,
      apiError,
      isStale,
      destinationCountry,
      setDestinationCountry,
      suggestRoute,
      setSuggestRoute,
      isFlexibleDates,
      setIsFlexibleDates,
      packageScope,
      setPackageScope,
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
      travelMode,
      setTravelMode,
      currentRoute,
      calculationStatus,
      recommendedDays,
      overriddenDays,
      requestDraft,
      requestLoading,
      submissionState,
      apiError,
      isStale,
      destinationCountry,
      suggestRoute,
      isFlexibleDates,
      packageScope,
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
