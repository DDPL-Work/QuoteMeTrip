import { PACKAGE_OPTIONS } from '../features/trip/validation.js';

export function PackageSelector({ value, onChange }) {
  return (
    <label>
      {' '}
      Package
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {PACKAGE_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
