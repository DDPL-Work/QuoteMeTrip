import { Link } from 'react-router-dom';

export function QuotationCard({ quotation }) {
  if (!quotation) return null;
  const agency = quotation.agency ?? {};
  return (
    <li>
      <Link to={`/quotations/${quotation.id}`}>
        Quotation #{quotation.id} ({quotation.quotationType}) —{' '}
        {quotation.totalAmount ?? quotation.total ?? '—'} {quotation.currency ?? ''} —{' '}
        {agency.agencyName ?? 'Agency'}
        {agency.city ? `, ${agency.city}` : ''}
        {agency.country ? ` ${agency.country}` : ''} ({quotation.status})
      </Link>
    </li>
  );
}
