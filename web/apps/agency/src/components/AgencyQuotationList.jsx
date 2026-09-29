import { Link } from 'react-router-dom';

export function AgencyQuotationList({ quotations }) {
  if (!quotations || quotations.length === 0) return <p>No quotations yet.</p>;
  return (
    <ul aria-label="Agency quotations">
      {quotations.map((q) => (
        <li key={q.id}>
          <Link to={`/quotations/${q.id}`}>
            Quotation #{q.id} ({q.quotationType}, {q.status}) — {q.totalAmount ?? q.total ?? '—'}{' '}
            {q.currency ?? ''}
          </Link>
        </li>
      ))}
    </ul>
  );
}
