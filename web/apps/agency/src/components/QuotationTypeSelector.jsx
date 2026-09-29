import { QUOTATION_TYPES, QUOTATION_TYPE_LABELS } from '@troublefree/types';

export function QuotationTypeSelector({ value, onChange }) {
  return (
    <label>
      Quotation type
      <select
        aria-label="Quotation type"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">Select type</option>
        {QUOTATION_TYPES.map((t) => (
          <option key={t} value={t}>
            {QUOTATION_TYPE_LABELS[t] ?? t}
          </option>
        ))}
      </select>
    </label>
  );
}
