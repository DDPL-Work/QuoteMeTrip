/**
 * Phase 4.2 Motion System — Standardized Animation Variants
 */

import { TRANSITIONS } from './transitions.js';

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: TRANSITIONS.reveal },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITIONS.normal },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: TRANSITIONS.normal },
};

export const slideRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: TRANSITIONS.normal },
};

export const slideLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: TRANSITIONS.normal },
};

export const staggerContainer = (staggerDelay = 0.06) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05,
    },
  },
});

export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITIONS.reveal },
  exit: { opacity: 0, y: -8, transition: TRANSITIONS.micro },
};

export const cardHover = {
  rest: { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  hover: { y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.1)', transition: TRANSITIONS.micro },
};
