import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, REDUCED_MOTION_VARIANTS } from '../../motion/motion-config.js';

export function MotionReveal({
  children,
  className = '',
  style = {},
  variant = fadeUp,
  delay = 0,
}) {
  const shouldReduceMotion = useReducedMotion();
  const activeVariants = shouldReduceMotion ? REDUCED_MOTION_VARIANTS : variant;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={activeVariants}
      transition={{ delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default MotionReveal;
