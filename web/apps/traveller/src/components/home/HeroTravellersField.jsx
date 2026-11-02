import React, { useState, useEffect } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';

export function HeroTravellersField({ value = 2, onChange }) {
  const { t } = useI18n();
  const [localText, setLocalText] = useState(String(value ?? 2));

  useEffect(() => {
    setLocalText(String(value ?? 2));
  }, [value]);

  const handleChange = (e) => {
    const nextStr = e.target.value;
    // Allow empty string or digits only
    if (nextStr === '' || /^\d+$/.test(nextStr)) {
      setLocalText(nextStr);
      if (nextStr !== '') {
        const parsed = parseInt(nextStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          onChange(parsed);
        }
      }
    }
  };

  const handleBlur = () => {
    if (localText === '' || parseInt(localText, 10) < 1) {
      setLocalText('1');
      onChange(1);
    } else if (parseInt(localText, 10) > 100) {
      setLocalText('100');
      onChange(100);
    } else {
      const parsed = parseInt(localText, 10);
      setLocalText(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <div className="g-f">
      <FiUsers size={18} aria-hidden="true" style={{ color: '#147D33' }} />
      <label style={{ width: '100%' }}>
        {t('home.search.travellers', 'Travellers')}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label={t('home.search.travellers', 'Number of travellers')}
        />
      </label>
    </div>
  );
}

export default HeroTravellersField;
