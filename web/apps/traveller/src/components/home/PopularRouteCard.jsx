import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TiltCard } from '../motion/TiltCard.jsx';

/**
 * PopularRouteCard Component
 * Displays a single route card with 3D pointer tilt, layered depth, and image scale interaction.
 */
export function PopularRouteCard({ route, index = 0, onSelectRoute }) {
  const shouldReduceMotion = useReducedMotion();

  const handleRouteClick = () => {
    if (onSelectRoute) {
      onSelectRoute(route);
    }
  };

  return (
    <TiltCard
      className="g-route"
      as="button"
      type="button"
      maxRotateX={5}
      maxRotateY={7}
      depth={14}
      aria-label={`Plan a trip to ${route.name} - ${route.tagline || route.country}`}
      onClick={handleRouteClick}
      style={{
        width: '100%',
        textDecoration: 'none',
        display: 'block',
      }}
    >
      <motion.img
        src={route.image || `/images/route${(index % 6) + 1}.avif`}
        alt={route.name}
        onError={(e) => {
          e.currentTarget.src = '/images/route.png';
        }}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <motion.span
        className="t"
        style={{
          transformStyle: 'preserve-3d',
          transform: shouldReduceMotion ? 'none' : 'translateZ(14px)',
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          color: '#fff',
          zIndex: 2,
        }}
      >
        <b style={{ display: 'block', fontSize: '17px', fontWeight: 700 }}>{route.name}</b>
        <span style={{ fontSize: '12.5px', opacity: 0.92 }}>{route.tagline || route.country}</span>
      </motion.span>
    </TiltCard>
  );
}

export default PopularRouteCard;
