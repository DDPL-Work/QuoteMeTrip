import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroSearchPanel } from './HeroSearchPanel.jsx';

/**
 * HomeHero Component
 * Hero section with background entrance motion, line-level headline reveal, and search panel composition.
 */
export function HomeHero({ trip, setTrip, scope, setScope, onSubmit, isSubmitting }) {
  const shouldReduceMotion = useReducedMotion();

  const textVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (customDelay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: customDelay, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <section className="g-hero">
      <motion.img
        src="/images/hero.avif"
        alt=""
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.88, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <div className="g-wrap">
        <motion.div
          className="g-eyebrow"
          variants={textVariants}
          custom={0.05}
          initial="hidden"
          animate="visible"
        >
          Day-by-day holidays · local agencies
        </motion.div>

        <motion.h1 initial="hidden" animate="visible">
          <motion.span
            style={{ display: 'block', color: 'inherit' }}
            variants={textVariants}
            custom={0.12}
          >
            One request.
          </motion.span>
          <motion.span
            style={{ display: 'block', color: '#D96A00' }}
            variants={textVariants}
            custom={0.2}
          >
            Multiple travel quotes.
          </motion.span>
        </motion.h1>

        <motion.p
          className="lead"
          variants={textVariants}
          custom={0.28}
          initial="hidden"
          animate="visible"
        >
          Plan each day of your trip — dates, destinations, hotels, guides and activities. Verified
          agencies in that country send you their offers to compare.
        </motion.p>

        <HeroSearchPanel
          trip={trip}
          setTrip={setTrip}
          scope={scope}
          setScope={setScope}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </section>
  );
}

export default HomeHero;
