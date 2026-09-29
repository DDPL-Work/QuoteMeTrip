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
    <fieldset>
      <legend>Items</legend>
      {(items ?? []).map((item, index) => (
        <div key={index} data-testid={`quotation-item-${index}`}>
          <label>
            Type
            <select
              aria-label={`Item ${index + 1} type`}
              value={item.itemType ?? 'other'}
              onChange={(e) => update(index, { itemType: e.target.value })}
            >
              {QUOTATION_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUOTATION_ITEM_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              aria-label={`Item ${index + 1} title`}
              value={item.title ?? ''}
              onChange={(e) => update(index, { title: e.target.value })}
            />
          </label>
          <label>
            Quantity
            <input
              aria-label={`Item ${index + 1} quantity`}
              type="number"
              min="0.01"
              step="0.01"
              value={item.quantity ?? 1}
              onChange={(e) => update(index, { quantity: Number(e.target.value) })}
            />
          </label>
          <label>
            Unit price
            <input
              aria-label={`Item ${index + 1} unit price`}
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice ?? 0}
              onChange={(e) => update(index, { unitPrice: Number(e.target.value) })}
            />
          </label>
          <button type="button" onClick={() => remove(index)}>
            Remove item {index + 1}
          </button>
        </div>
      ))}
      <button type="button" onClick={add}>
        Add item
      </button>
    </fieldset>
  );
}
