export function QuotationSummary({ quotation }) {
  if (!quotation) return <p>No quotation yet.</p>;
  const items = quotation.items ?? [];
  return (
    <section aria-label="Quotation summary">
      <h2>
        Quotation #{quotation.id} ({quotation.status ?? 'draft'})
      </h2>
      <p>Type: {quotation.quotationType ?? '—'}</p>
      <p>Currency: {quotation.currency ?? '—'}</p>
      <p>Valid until: {quotation.validUntil ?? '—'}</p>
      {quotation.notes && <p>Notes: {quotation.notes}</p>}
      <p>
        Total: {quotation.totalAmount ?? quotation.total ?? '—'} {quotation.currency ?? ''}
      </p>
      <ul>
        {items.map((item, i) => (
          <li key={item.id ?? i}>
            {item.title} ({item.itemType}) × {item.quantity} @ {item.unitPrice} ={' '}
            {item.lineTotal ?? item.line_total ?? '—'}
          </li>
        ))}
      </ul>
    </section>
  );
}
