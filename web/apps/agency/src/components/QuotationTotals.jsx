import { itemsTotal, lineTotal } from '../lib/quotation-totals.js';

export function QuotationTotals({ items, currency }) {
  const total = itemsTotal(items);
  return (
    <section aria-label="Quotation totals">
      <h3>Totals</h3>
      <ul>
        {(items ?? []).map((item, index) => (
          <li key={index} data-testid={`line-total-${index}`}>
            {item.title || `Item ${index + 1}`}: {lineTotal(item)} {currency ?? ''}
          </li>
        ))}
      </ul>
      <p data-testid="items-total">
        Total: {total} {currency ?? ''}
      </p>
    </section>
  );
}
