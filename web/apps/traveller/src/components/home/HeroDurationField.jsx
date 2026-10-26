import React from 'react';
import { FiClock } from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';

export function HeroDurationField({ value = 7, onChange }) {
  const { t } = useI18n();
  return (
    <div className="g-f">
      <FiClock size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        {t('home.search.duration', 'How many days?')}
        <input
          type="number"
          min="1"
          max="30"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          aria-label={t('home.search.duration', 'How many days?')}
        />
      </label>
    </div>
  );
}

export default HeroDurationField;
