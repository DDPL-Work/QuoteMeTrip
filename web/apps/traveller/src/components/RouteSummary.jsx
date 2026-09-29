export function RouteSummary({ route }) {
  if (!route) return <p>No route calculated yet.</p>;
  return (
    <section aria-label="Route summary">
      <h3>Route summary</h3>
      <p>Distance: {route.distanceKm ?? route.distance_km ?? '—'} km</p>
      <p>Duration: {route.durationMinutes ?? route.duration_minutes ?? '—'} min</p>
      <p>Recommended days: {route.recommendedDays ?? route.recommended_days ?? '—'}</p>
    </section>
  );
}
