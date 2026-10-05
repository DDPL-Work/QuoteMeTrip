import { QuotationCard } from './QuotationCard.jsx';

export function QuotationList({ quotations }) {
  if (!quotations || quotations.length === 0)
    return <p className="tf-empty-text">No quotations yet.</p>;

  return (
    <ul aria-label="Quotations" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {quotations.map((q) => (
        <QuotationCard key={q.id} quotation={q} />
      ))}
    </ul>
  );
}
