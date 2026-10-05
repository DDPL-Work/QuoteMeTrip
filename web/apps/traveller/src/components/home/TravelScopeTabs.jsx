import React from 'react';
import { motion } from 'framer-motion';
import { FiCompass, FiBriefcase, FiInbox, FiMap, FiMapPin } from 'react-icons/fi';

const SCOPE_OPTIONS = [
  { label: 'Blue Cruise', icon: FiCompass },
  { label: 'Full package', icon: FiBriefcase },
  { label: 'Hotel only', icon: FiInbox },
  { label: 'Vehicle + driver', icon: FiMap },
  { label: 'Guide & activities', icon: FiMapPin },
];

/**
 * TravelScopeTabs Component
 * Renders scope selection buttons with animated active background indicator.
 */
export function TravelScopeTabs({ activeScope, onSelectScope }) {
  return (
    <div className="g-tabs" role="group" aria-label="What do you need?">
      {SCOPE_OPTIONS.map(({ label, icon: Icon }) => {
        const isSelected = activeScope === label;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectScope(label)}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Icon
              size={17}
              style={{
                color: isSelected ? '#147D33' : '#66716B',
                transition: 'color 0.2s ease',
              }}
            />
            <span>{label}</span>
            {isSelected && (
              <motion.div
                layoutId="activeScopeTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#E5F2EA',
                  borderRadius: '10px',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TravelScopeTabs;
