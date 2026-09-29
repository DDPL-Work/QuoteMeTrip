export function QuotationItemList({ items, currency }) {
  if (!items || items.length === 0) return <p>No items.</p>;
  return (
    <table aria-label="Quotation items">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Unit price</th>
          <th>Line total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id ?? i}>
            <td>{item.title}</td>
            <td>{item.itemType ?? item.item_type ?? '—'}</td>
            <td>{item.quantity ?? '—'}</td>
            <td>
              {item.unitPrice ?? item.unit_price ?? '—'} {currency ?? ''}
            </td>
            <td>
              {item.lineTotal ?? item.line_total ?? '—'} {currency ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
