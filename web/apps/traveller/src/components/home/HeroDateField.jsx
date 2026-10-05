import React from 'react';
import { FiCalendar } from 'react-icons/fi';

export function HeroDateField({ value, onChange }) {
  return (
    <div className="g-f">
      <FiCalendar size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        First day
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label="First day"
        />
      </label>
    </div>
  );
}

export default HeroDateField;
