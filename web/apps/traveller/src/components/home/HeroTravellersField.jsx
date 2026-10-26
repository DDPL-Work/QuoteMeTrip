import React from 'react';
import { FiUsers } from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';

export function HeroTravellersField({ value = 2, onChange }) {
  const { t } = useI18n();
  return (
    <div className="g-f">
      <FiUsers size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        {t('home.search.travellers', 'Travellers')}
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          aria-label={t('home.search.travellers', 'Number of travellers')}
        />
      </label>
    </div>
  );
}

export default HeroTravellersField;
