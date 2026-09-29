export function TravelRequestSummary({ request }) {
  if (!request) return <p>No travel request yet.</p>;
  return (
    <section aria-label="Travel request summary">
      <h3>Request summary</h3>
      <p>Status: {request.status ?? 'draft'}</p>
      <p>
        Dates: {request.travelStartDate ?? '—'} → {request.travelEndDate ?? '—'}
      </p>
      <p>Travellers: {request.numberOfTravellers ?? '—'}</p>
      <p>Package: {request.packageType ?? '—'}</p>
    </section>
  );
}
