import { QuotationCard } from './QuotationCard.jsx';

export function QuotationList({ quotations }) {
  if (!quotations || quotations.length === 0) return <p>No quotations yet.</p>;
  return (
    <ul aria-label="Quotations">
      {quotations.map((q) => (
        <QuotationCard key={q.id} quotation={q} />
      ))}
    </ul>
  );
}
