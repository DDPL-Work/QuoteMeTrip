const LABELS = {
  blue_cruise: 'Blue Cruise',
  full_package: 'Full package',
  hotel_only: 'Hotel only',
  vehicle_driver: 'Vehicle + driver',
  guide_activities: 'Guide & activities',
};

const DURATIONS = {
  '4d_3n': '4 Days / 3 Nights',
  '6d_5n': '6 Days / 5 Nights',
};

export function TravelRequestSummary({ request }) {
  if (!request) return <p>No travel request yet.</p>;

  let pkgDisplay = LABELS[request.packageType] || request.packageType || '—';
  if (request.packageType === 'blue_cruise' && request.cruiseDuration) {
    pkgDisplay += ` (${DURATIONS[request.cruiseDuration] || request.cruiseDuration})`;
  }

  return (
    <section aria-label="Travel request summary">
      <h3>Request summary</h3>
      <p>Status: {request.status ?? 'draft'}</p>
      <p>
        Dates: {request.travelStartDate ?? '—'} → {request.travelEndDate ?? '—'}
      </p>
      <p>Travellers: {request.numberOfTravellers ?? '—'}</p>
      <p>Package: {pkgDisplay}</p>
    </section>
  );
}
