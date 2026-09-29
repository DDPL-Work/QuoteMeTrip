import { Link } from 'react-router-dom';

export function AgencyRequestDetail({ request, match }) {
  if (!request) return <p>No request found.</p>;
  const firstName = request.traveller?.firstName ?? 'Traveller';
  return (
    <section aria-label="Agency request detail">
      <h2>
        Request #{request.id} — {request.destination ?? request.title ?? ''}
      </h2>
      <p>Traveller: {firstName}</p>
      <p>Status: {request.status ?? '—'}</p>
      <p>Match status: {request.matchStatus ?? match?.matchStatus ?? '—'}</p>
      <p>
        Dates: {request.travelStartDate ?? '—'} → {request.travelEndDate ?? '—'}
      </p>
      <p>Travellers: {request.numberOfTravellers ?? '—'}</p>
      <p>Package: {request.packageType ?? '—'}</p>
      {request.id && (
        <p>
          <Link to={`/requests/${request.id}/quotations/new`}>Create quotation</Link>
        </p>
      )}
    </section>
  );
}
