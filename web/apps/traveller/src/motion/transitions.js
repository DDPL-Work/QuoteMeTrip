/**
 * Phase 4.2 Motion System — Restrained Production Transitions & Timings
 */

export const TIMINGS = {
  micro: 0.15,      // 150ms — Micro-interactions (hover, active, toggle)
  normal: 0.25,     // 250ms — Standard state transitions & step changes
  reveal: 0.45,     // 450ms — Page entry & section scroll reveals
  hero: 0.70,       // 700ms — Staged hero headline reveal
};

export const EASINGS = {
  easeOut: [0.16, 1, 0.3, 1],      // Smooth cubic-bezier ease-out
  easeInOut: [0.45, 0, 0.55, 1],   // Smooth ease-in-out for modals
  springSoft: { type: 'spring', stiffness: 300, damping: 25 },
};

export const TRANSITIONS = {
  micro: { duration: TIMINGS.micro, ease: EASINGS.easeOut },
  normal: { duration: TIMINGS.normal, ease: EASINGS.easeOut },
  reveal: { duration: TIMINGS.reveal, ease: EASINGS.easeOut },
  hero: { duration: TIMINGS.hero, ease: EASINGS.easeOut },
};

export default TRANSITIONS;
