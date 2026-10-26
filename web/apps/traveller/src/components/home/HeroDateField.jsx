import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';

export function HeroDateField({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="g-f">
      <FiCalendar size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        {t('home.search.startDate', 'First day')}
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('home.search.startDate', 'First day')}
        />
      </label>
    </div>
  );
}

export default HeroDateField;
