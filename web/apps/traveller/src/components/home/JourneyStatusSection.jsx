import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STATUS_ITEMS = [
  ['Draft', 'You are still planning'],
  ['Sent', 'Agencies in your country notified'],
  ['Quotes received', 'Compare the offers'],
  ['Agreed', 'Price locked, quoting closed'],
  ['Deposit paid', 'Contacts unlocked'],
  ['Confirmed', 'Written confirmation + PDF'],
];

export function JourneyStatusSection() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="g-journey">
      <div className="jt">Your trip status, from start to finish</div>
      <motion.ol
        variants={shouldReduceMotion ? {} : containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, threshold: 0.2 }}
      >
        {STATUS_ITEMS.map(([title, desc], i) => (
          <motion.li key={i} variants={shouldReduceMotion ? {} : itemVariants}>
            <span className="n">{i + 1}</span>
            <b>{title}</b>
            <span>{desc}</span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}

export default JourneyStatusSection;
