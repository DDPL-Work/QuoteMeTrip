import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, REDUCED_MOTION_VARIANTS } from '../../motion/motion-config.js';

export function StaggerContainer({ children, className = '', style = {}, staggerDelay = 0.06 }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? REDUCED_MOTION_VARIANTS : staggerContainer(staggerDelay);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={variants}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default StaggerContainer;
