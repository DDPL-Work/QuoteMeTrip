import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageTransition, REDUCED_MOTION_VARIANTS } from '../../motion/motion-config.js';

export function MotionPage({ children, className = '', style = {} }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? REDUCED_MOTION_VARIANTS : pageTransition;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      className={className}
      style={{ width: '100%', ...style }}
    >
      {children}
    </motion.div>
  );
}

export default MotionPage;
