import React from 'react';
import { FiClock } from 'react-icons/fi';

export function HeroDurationField({ value = 7, onChange }) {
  return (
    <div className="g-f">
      <FiClock size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        How many days?
        <input
          type="number"
          min="1"
          max="30"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          aria-label="How many days?"
        />
      </label>
    </div>
  );
}

export default HeroDurationField;
