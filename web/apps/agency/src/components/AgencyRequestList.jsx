import { AgencyRequestCard } from './AgencyRequestCard.jsx';

export function AgencyRequestList({ requests }) {
  if (!requests || requests.length === 0) return <p>No incoming requests.</p>;
  return (
    <ul aria-label="Incoming requests">
      {requests.map((r) => (
        <AgencyRequestCard key={r.id ?? r.travelRequestId} request={r} />
      ))}
    </ul>
  );
}
