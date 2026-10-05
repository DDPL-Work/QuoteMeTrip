import { QUOTATION_ITEM_TYPE_LABELS } from '@troublefree/types';

export function QuotationItemList({ items, currency }) {
  if (!items || items.length === 0) return <p className="tf-empty-text">No items.</p>;

  return (
    <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
      <table
        aria-label="Quotation items"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
          textAlign: 'left',
          background: '#ffffff',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        <thead>
          <tr
            style={{
              background: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              color: '#475569',
            }}
          >
            <th style={{ padding: '0.75rem 1rem' }}>Title</th>
            <th style={{ padding: '0.75rem 1rem' }}>Type</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit price</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Line total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id ?? i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                <div>{item.title}</div>
                {item.description && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
                    {item.description}
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: '0.85rem 1rem',
                  color: 'var(--tf-primary, #0c4e28)',
                  fontWeight: 600,
                }}
              >
                {QUOTATION_ITEM_TYPE_LABELS[item.itemType] ??
                  item.itemType ??
                  item.item_type ??
                  '—'}
              </td>
              <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#475569' }}>
                {item.quantity ?? '—'}
              </td>
              <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569' }}>
                {item.unitPrice ?? item.unit_price ?? '—'} {currency ?? ''}
              </td>
              <td
                style={{
                  padding: '0.85rem 1rem',
                  textAlign: 'right',
                  fontWeight: 700,
                  color: '#09341b',
                }}
              >
                {item.lineTotal ??
                  item.line_total ??
                  (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}{' '}
                {currency ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
