import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { TiltCard } from '../motion/TiltCard.jsx';

/**
 * TravelGuideCard Component
 * Displays a guide tip card with icon, text, arrow hover transition, and mild 3D tilt.
 */
export function TravelGuideCard({ icon: Icon, title, description, href = '#guide', onClick }) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TiltCard
      className="g-tip"
      as="a"
      href={href}
      onClick={onClick}
      maxRotateX={3}
      maxRotateY={4}
      depth={8}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
    >
      <div className="ic">
        <Icon size={20} aria-hidden="true" />
      </div>
      <b>{title}</b>
      <span>{description}</span>
      <span
        style={{
          color: '#147D33',
          fontWeight: '600',
          fontSize: '13.5px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: 'auto',
          paddingTop: '8px',
        }}
      >
        <span>Read guide</span>
        <motion.span
          animate={isHovered && !shouldReduceMotion ? { x: 4 } : { x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <FiArrowRight size={14} aria-hidden="true" />
        </motion.span>
      </span>
    </TiltCard>
  );
}

export default TravelGuideCard;
