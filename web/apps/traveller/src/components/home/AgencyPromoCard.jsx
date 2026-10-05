import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * AgencyPromoCard Component
 * Dark green card inviting travel agencies to join, with orange CTA button.
 */
export function AgencyPromoCard({ onPartnerClick }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="g-agc"
      whileHover={
        shouldReduceMotion ? {} : { y: -3, boxShadow: '0 16px 36px -16px rgba(12, 78, 40, 0.45)' }
      }
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <span
        style={{
          color: '#FC7C00',
          fontWeight: '700',
          fontSize: '12px',
          letterSpacing: '.12em',
        }}
      >
        FOR TRAVEL AGENCIES
      </span>
      <b>Receive travel requests for your country</b>
      <span>
        Choose a fixed membership or pay a commission per confirmed booking. Manage everything in
        the Agency app.
      </span>
      <motion.button
        className="g-btn p"
        type="button"
        onClick={onPartnerClick}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        style={{ alignSelf: 'flex-start', marginTop: '8px' }}
      >
        Become a partner agency
      </motion.button>
    </motion.div>
  );
}

export default AgencyPromoCard;
