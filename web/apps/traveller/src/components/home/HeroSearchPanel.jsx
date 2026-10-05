import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { TravelScopeTabs } from './TravelScopeTabs.jsx';
import { HeroDestinationField } from './HeroDestinationField.jsx';
import { HeroDateField } from './HeroDateField.jsx';
import { HeroDurationField } from './HeroDurationField.jsx';
import { HeroTravellersField } from './HeroTravellersField.jsx';

/**
 * HeroSearchPanel Component
 * Floating search panel with 3D depth, tab selection, form field composition, and animated CTA.
 */
export function HeroSearchPanel({
  trip,
  setTrip,
  scope,
  setScope,
  onSubmit,
  isSubmitting = false,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.form
      className="g-search"
      aria-label="Create a travel request"
      onSubmit={onSubmit}
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

      <div className="g-fields">
        <HeroDestinationField
          value={trip.country}
          onChange={(country) => setTrip({ ...trip, country })}
        />

        <HeroDateField
          value={trip.days[0]?.date || ''}
          onChange={(date) => setTrip({ ...trip, days: [{ date }] })}
        />

        <HeroDurationField
          value={trip.daysCount ?? 7}
          onChange={(daysCount) => setTrip({ ...trip, daysCount })}
        />

        <HeroTravellersField
          value={trip.travellers}
          onChange={(travellers) => setTrip({ ...trip, travellers })}
        />

        <motion.button
          className="g-go"
          type="submit"
          disabled={isSubmitting}
          whileHover={shouldReduceMotion ? {} : { y: -2 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        >
          <span>{isSubmitting ? 'Searching...' : 'Get free quotes'}</span>
          <motion.span
            style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}
            animate={isHovered && !shouldReduceMotion ? { x: 4 } : { x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <FiArrowRight size={18} aria-hidden="true" />
          </motion.span>
        </motion.button>
      </div>

      <div className="g-sub">
        <div className="row" style={{ gap: '18px', flexWrap: 'wrap' }}>
          <label>
            <input
              type="checkbox"
              checked={trip.flexible}
              onChange={(e) => setTrip({ ...trip, flexible: e.target.checked })}
            />
            My dates are flexible
          </label>
          <label>
            <input
              type="checkbox"
              checked={trip.suggest}
              onChange={(e) => setTrip({ ...trip, suggest: e.target.checked })}
            />
            Let agencies suggest the route
          </label>
        </div>
        <a href="#g-how">How does it work?</a>
      </div>
    </motion.form>
  );
}

export default HeroSearchPanel;
