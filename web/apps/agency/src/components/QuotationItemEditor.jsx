import { FiPlus, FiTrash2, FiTag } from 'react-icons/fi';
import { QUOTATION_ITEM_TYPES, QUOTATION_ITEM_TYPE_LABELS } from '@troublefree/types';

export function QuotationItemEditor({ items, onChange }) {
  function update(index, patch) {
    onChange?.(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function add() {
    onChange?.([...(items ?? []), { itemType: 'other', title: '', quantity: 1, unitPrice: 0 }]);
  }

  function remove(index) {
    onChange?.(items.filter((_, i) => i !== index));
  }

  return (
    <fieldset
      className="agency-fieldset"
      style={{ border: 'none', padding: 0, margin: '1.5rem 0' }}
    >
      <legend
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--agency-text)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <FiTag style={{ color: 'var(--agency-secondary)' }} /> Quotation Items / Services
      </legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(items ?? []).map((item, index) => {
          const qty = Number(item.quantity ?? 1);
          const price = Number(item.unitPrice ?? 0);
          const lineTotal = (qty * price).toFixed(2);

          return (
            <div
              key={index}
              data-testid={`quotation-item-${index}`}
              style={{
                background: '#ffffff',
                border: '1px solid var(--agency-border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--agency-secondary)',
                    background: 'var(--agency-primary-light)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  Item #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    borderRadius: '0.375rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  aria-label={`Remove item ${index + 1}`}
                >
                  <FiTrash2 /> Remove
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '0.85rem',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--agency-text)',
                  }}
                >
                  Category
                  <select
                    aria-label={`Item ${index + 1} type`}
                    value={item.itemType ?? 'other'}
                    onChange={(e) => update(index, { itemType: e.target.value })}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--agency-border)',
                      fontSize: '0.9rem',
                      color: 'var(--agency-text)',
                      background: '#ffffff',
                    }}
                  >
                    {QUOTATION_ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {QUOTATION_ITEM_TYPE_LABELS[t] ?? t}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--agency-text)',
                    gridColumn: 'span 2',
                  }}
                >
                  Title / Service Name
                  <input
                    aria-label={`Item ${index + 1} title`}
                    value={item.title ?? ''}
                    placeholder="e.g., 4-Star Boutique Hotel Istanbul"
                    onChange={(e) => update(index, { title: e.target.value })}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--agency-border)',
                      fontSize: '0.9rem',
                      color: 'var(--agency-text)',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.85rem',
                  alignItems: 'flex-end',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--agency-text)',
                  }}
                >
                  Quantity
                  <input
                    aria-label={`Item ${index + 1} quantity`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity ?? 1}
                    onChange={(e) => update(index, { quantity: Number(e.target.value) })}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--agency-border)',
                      fontSize: '0.9rem',
                      color: 'var(--agency-text)',
                    }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--agency-text)',
                  }}
                >
                  Unit Price
                  <input
                    aria-label={`Item ${index + 1} unit price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice ?? 0}
                    onChange={(e) => update(index, { unitPrice: Number(e.target.value) })}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--agency-border)',
                      fontSize: '0.9rem',
                      color: 'var(--agency-text)',
                    }}
                  />
                </label>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    textAlign: 'right',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontWeight: 600,
                      display: 'block',
                    }}
                  >
                    Line Total
                  </span>
                  <span
                    style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--agency-primary)' }}
                  >
                    ${lineTotal}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        style={{
          marginTop: '1rem',
          background: '#ffffff',
          color: 'var(--agency-secondary)',
          border: '1px dashed var(--agency-secondary)',
          borderRadius: '0.5rem',
          padding: '0.65rem 1.25rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          width: '100%',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <FiPlus /> Add Item
      </button>
    </fieldset>
  );
}
