import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@troublefree/i18n';
import { FiCheck, FiSliders, FiHelpCircle, FiCalendar } from 'react-icons/fi';
import { TravelScopeTabs } from './TravelScopeTabs.jsx';

/**
 * HeroSearchPanel Component
 * Floating service-selection bar with 3D depth, custom checkboxes with React Icons,
 * and service tabs that trigger dedicated service modals.
 */
export function HeroSearchPanel({
  trip,
  setTrip,
  scope,
  setScope,
}) {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="g-search g-search-modal-only"
      aria-label="Select a travel service"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={{
        perspective: '1400px',
        transformStyle: 'preserve-3d',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        boxShadow: isHovered
          ? '0 28px 60px -20px rgba(19, 41, 28, 0.35), 0 4px 12px rgba(19, 41, 28, 0.08)'
          : '0 24px 50px -24px rgba(19, 41, 28, 0.25), 0 2px 6px rgba(19, 41, 28, 0.06)',
      }}
    >
      <TravelScopeTabs activeScope={scope} onSelectScope={setScope} />

      <div
        className="g-sub"
        style={{
          borderTop: 'none',
          padding: '12px 14px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Custom Checkbox: Flexible Dates */}
          <button
            type="button"
            role="checkbox"
            aria-checked={Boolean(trip.flexible)}
            onClick={() => setTrip({ ...trip, flexible: !trip.flexible })}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: trip.flexible ? '#147D33' : '#4A5568',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: trip.flexible ? '2px solid #147D33' : '2px solid #CBD5E1',
                backgroundColor: trip.flexible ? '#147D33' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'all 0.15s ease',
              }}
            >
              {trip.flexible && <FiCheck size={13} strokeWidth={3} />}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FiCalendar size={14} style={{ color: trip.flexible ? '#147D33' : '#718096' }} />
              {t('home.search.flexibleDates', 'My dates are flexible')}
            </span>
          </button>

          {/* Custom Checkbox: Suggest Route */}
          <button
            type="button"
            role="checkbox"
            aria-checked={Boolean(trip.suggest)}
            onClick={() => setTrip({ ...trip, suggest: !trip.suggest })}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: trip.suggest ? '#147D33' : '#4A5568',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: trip.suggest ? '2px solid #147D33' : '2px solid #CBD5E1',
                backgroundColor: trip.suggest ? '#147D33' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'all 0.15s ease',
              }}
            >
              {trip.suggest && <FiCheck size={13} strokeWidth={3} />}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FiSliders size={14} style={{ color: trip.suggest ? '#147D33' : '#718096' }} />
              {t('home.search.suggestRoute', 'Let agencies suggest the route')}
            </span>
          </button>
        </div>

        <a
          href="#g-how"
          style={{
            fontSize: '13px',
            color: '#147D33',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <FiHelpCircle size={15} />
          {t('home.search.howItWorks', 'How does it work?')}
        </a>
      </div>
    </motion.div>
  );
}

export default HeroSearchPanel;
