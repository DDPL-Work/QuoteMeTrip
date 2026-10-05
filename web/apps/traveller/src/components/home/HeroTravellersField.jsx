import React from 'react';
import { FiUsers } from 'react-icons/fi';

export function HeroTravellersField({ value = 2, onChange }) {
  return (
    <div className="g-f">
      <FiUsers size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        Travellers
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          aria-label="Number of travellers"
        />
      </label>
    </div>
  );
}

export default HeroTravellersField;
