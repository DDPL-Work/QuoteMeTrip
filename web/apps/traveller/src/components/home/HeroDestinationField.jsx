import React from 'react';
import { FiMapPin } from 'react-icons/fi';

const COUNTRIES = ['Türkiye', 'Italy', 'Greece'];

export function HeroDestinationField({ value, onChange }) {
  return (
    <div className="g-f">
      <FiMapPin size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        Where are you going?
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Where are you going?"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default HeroDestinationField;
