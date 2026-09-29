import { useState } from 'react';
import { QUOTATION_TYPES, QUOTATION_ITEM_TYPES } from '@troublefree/types';
import { QuotationTypeSelector } from './QuotationTypeSelector.jsx';
import { QuotationItemEditor } from './QuotationItemEditor.jsx';
import { QuotationTotals } from './QuotationTotals.jsx';

export function QuotationForm({ initial, onSubmit, submitLabel = 'Save draft' }) {
  const [quotationType, setQuotationType] = useState(initial?.quotationType ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [items, setItems] = useState(
    initial?.items?.length
      ? initial.items
      : [{ itemType: 'other', title: '', quantity: 1, unitPrice: 0 }],
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!QUOTATION_TYPES.includes(quotationType)) {
      setError('Select a quotation type.');
      return;
    }
    if (!items.length) {
      setError('Add at least one item.');
      return;
    }
    for (const [i, item] of items.entries()) {
      if (!String(item.title ?? '').trim()) {
        setError(`Item ${i + 1} requires a title.`);
        return;
      }
      if (!QUOTATION_ITEM_TYPES.includes(item.itemType ?? 'other')) {
        setError(`Item ${i + 1} has an invalid type.`);
        return;
      }
      if (!(Number(item.quantity) > 0)) {
        setError(`Item ${i + 1} needs a quantity greater than 0.`);
        return;
      }
      if (!(Number(item.unitPrice) >= 0)) {
        setError(`Item ${i + 1} needs a unit price of 0 or more.`);
        return;
      }
    }
    // Totals are server-computed: never send subtotal/totalAmount.
    const payload = {
      quotationType,
      currency: currency || undefined,
      validUntil: validUntil || undefined,
      notes: notes || undefined,
      items: items.map((item) => ({
        itemType: item.itemType ?? 'other',
        title: String(item.title).trim(),
        description: item.description ?? undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };
    setSaving(true);
    try {
      await onSubmit?.(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Quotation form">
      {error && <p role="alert">{error}</p>}
      <QuotationTypeSelector value={quotationType} onChange={setQuotationType} />
      <label>
        Currency
        <input
          aria-label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
      </label>
      <label>
        Valid until
        <input
          aria-label="Valid until"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </label>
      <label>
        Notes
        <textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <QuotationItemEditor items={items} onChange={setItems} />
      <QuotationTotals items={items} currency={currency} />
      <button type="submit" disabled={saving}>
        {submitLabel}
      </button>
    </form>
  );
}
