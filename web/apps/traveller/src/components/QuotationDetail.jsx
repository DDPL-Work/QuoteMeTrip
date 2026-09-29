import { QuotationItemList } from './QuotationItemList.jsx';

// Comparison-friendly read-only view. No accept/select actions:
// quotation acceptance is out of scope for Phase 5.
export function QuotationDetail({ quotation }) {
  if (!quotation) return <p>No quotation found.</p>;
  const agency = quotation.agency ?? {};
  return (
    <section aria-label="Quotation detail">
      <h2>
        Quotation #{quotation.id} ({quotation.status ?? '—'})
      </h2>
      <p>Type: {quotation.quotationType ?? '—'}</p>
      <p>
        Agency: {agency.agencyName ?? '—'}
        {agency.city ? `, ${agency.city}` : ''}
        {agency.country ? `, ${agency.country}` : ''}
      </p>
      <p>
        Total: {quotation.totalAmount ?? quotation.total ?? '—'} {quotation.currency ?? ''}
      </p>
      <p>Valid until: {quotation.validUntil ?? '—'}</p>
      {quotation.notes && <p>Notes: {quotation.notes}</p>}
      <QuotationItemList items={quotation.items ?? []} currency={quotation.currency} />
    </section>
  );
}
