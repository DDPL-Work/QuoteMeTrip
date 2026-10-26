/**
 * Great-Circle Air Route Calculation Service.
 *
 * Implements straight-line / air distance and geometry visualization
 * using documented Haversine spherical great-circle formulas.
 *
 * Characteristics:
 * - Never calls Google Routes API (which does not support air travel).
 * - Accurately sums straight-line distances across multiple stops in selected order.
 * - Leaves travel duration as null (avoids fabricating flight schedules or speeds).
 * - Emits clear warnings explaining that this is great-circle distance rather than flight paths.
 */
import { haversineKm } from './base.provider.js';
import { encodePolyline } from './google-routes.provider.js';

export function calculateAirRoute(stops) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new Error('Air route requires at least two valid stops.');
  }

  let totalDistanceKm = 0;
  const legs = [];

  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1];
    const curr = stops[i];
    const legDistance = haversineKm(prev, curr);
    const roundedLeg = Math.round(legDistance * 100) / 100;
    totalDistanceKm += legDistance;

    legs.push({
      index: i - 1,
      startStopName: prev.name,
      endStopName: curr.name,
      distanceKm: roundedLeg,
      durationMinutes: null, // Flight duration is intentionally omitted (no fabricated schedules)
      travelMode: 'AIR',
    });
  }

  const roundedTotal = Math.round(totalDistanceKm * 100) / 100;

  // Polyline encoded [latitude, longitude] pairs
  const polylinePoints = stops.map((s) => [Number(s.latitude), Number(s.longitude)]);
  const encodedPolyline = encodePolyline(polylinePoints);

  // GeoJSON LineString coordinates [longitude, latitude]
  const coordinates = stops.map((s) => [Number(s.longitude), Number(s.latitude)]);

  const geometry = {
    type: 'LineString',
    coordinates,
    encodedPolyline,
  };

  // Recommended days: for air hops, allow 1 sightseeing day per destination visited
  const recommendedDays = Math.max(1, Math.min(30, stops.length));

  return {
    stops,
    startLocation: stops[0].name,
    finalDestination: stops[stops.length - 1].name,
    distanceKm: roundedTotal,
    durationMinutes: null,
    travelMode: 'AIR',
    isAir: true,
    modeLabel: 'Straight-Line / Air Distance',
    geometry,
    encodedPolyline,
    legs,
    recommendedDays,
    calculationProvider: 'great-circle-air',
    calculationVersion: 'v1',
    warnings: [
      'Straight-line / air distance calculated using great-circle spherical formula. This is not an actual airline flight path, aircraft schedule, or road route.',
    ],
    rawResponse: {
      provider: 'great-circle-air',
      travelMode: 'AIR',
      totalDistanceKm: roundedTotal,
      stopsCount: stops.length,
      legsCount: legs.length,
    },
  };
}
