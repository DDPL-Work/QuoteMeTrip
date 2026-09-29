import { Link } from 'react-router-dom';

export function AgencyRequestCard({ request }) {
  if (!request) return null;
  const id = request.id ?? request.travelRequestId ?? request.requestId;
  const matchStatus = request.matchStatus ?? request.match?.matchStatus ?? '—';
  const status = request.status ?? '—';
  const destination = request.destination ?? request.title ?? '—';
  const firstName = request.traveller?.firstName ?? 'Traveller';
  return (
    <li>
      <Link to={`/requests/${id}`}>
        Request #{id} — {destination} (match: {matchStatus}, status: {status}) — {firstName}
      </Link>
    </li>
  );
}
