/**
 * Phase 4.2 Motion System — Motion Configuration & Central Exports
 */

export * from './transitions.js';
export * from './variants.js';

export const FAST = 0.15;
export const NORMAL = 0.25;
export const SLOW = 0.45;
export const REVEAL = 0.50;
export const PAGE = 0.35;
export const STAGGER = 0.08;

export const REDUCED_MOTION_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.05 } },
};
