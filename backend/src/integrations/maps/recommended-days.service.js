/**
 * Recommended-day calculation (Phase 4 business service).
 *
 * Kept OUT of controllers by design: the formula lives here with
 * unit tests. Recommended days are an INITIAL suggestion — the
 * Traveller may override them when creating the request.
 *
 * Formula (v1):
 *   distanceDays     = ceil(distanceKm / KM_PER_DAY)
 *   stopDays         = ceil(intermediateStops / STOPS_PER_DAY)
 *   recommended      = clamp(distanceDays + stopDays, MIN_DAYS, MAX_DAYS)
 *   minimum of 1 day for any valid route.
 */
export const RECOMMENDED_DAYS_VERSION = 'v1';
export const KM_PER_DAY = 300;
export const STOPS_PER_DAY = 2;
export const MIN_DAYS = 1;
export const MAX_DAYS = 30;

export function calculateRecommendedDays({ distanceKm = 0, intermediateStops = 0 } = {}) {
  const distance = Number(distanceKm);
  const stops = Number(intermediateStops);
  const safeDistance = Number.isFinite(distance) && distance > 0 ? distance : 0;
  const safeStops = Number.isFinite(stops) && stops > 0 ? Math.floor(stops) : 0;

  const distanceDays = Math.ceil(safeDistance / KM_PER_DAY);
  const stopDays = Math.ceil(safeStops / STOPS_PER_DAY);
  const total = distanceDays + stopDays;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, total));
}
