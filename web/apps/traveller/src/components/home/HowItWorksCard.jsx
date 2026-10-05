import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import { TiltCard } from '../motion/TiltCard.jsx';
import { ItineraryIllustration } from '../illustrations/ItineraryIllustration.jsx';
import { QuotationIllustration } from '../illustrations/QuotationIllustration.jsx';
import { PaymentIllustration } from '../illustrations/PaymentIllustration.jsx';

const ILLUSTRATIONS = {
  1: ItineraryIllustration,
  2: QuotationIllustration,
  3: PaymentIllustration,
};

/**
 * HowItWorksCard Component
 * Displays a 3-step process card with custom SVG illustration, check list, tipbox, and mild 3D tilt.
 */
export function HowItWorksCard({
  stepNumber,
  badgeText,
  title,
  description,
  ticks = [],
  tip,
  ctaText,
  onCtaClick,
}) {
  const shouldReduceMotion = useReducedMotion();
  const Illustration = ILLUSTRATIONS[stepNumber] || ItineraryIllustration;

  return (
    <TiltCard
      className="g-stepcard"
      maxRotateX={2.5}
      maxRotateY={4}
      depth={8}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="art">
        <Illustration />
      </div>
      <div className="b">
        <motion.span
          className="sn"
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          style={{ display: 'inline-block', originX: 0 }}
        >
          {badgeText}
        </motion.span>
        <h3>{title}</h3>
        <p>{description}</p>
        <ul className="ticks" style={{ listStyle: 'none', padding: 0 }}>
          {ticks.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '6px',
                fontSize: '14px',
                lineHeight: '1.45',
              }}
            >
              <FiCheckCircle
                size={16}
                style={{
                  color: '#147D33',
                  flexShrink: 0,
                  marginTop: '3px',
                }}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {tip && <div className="tipbox">{tip}</div>}
        {ctaText && (
          <motion.button
            className="g-btn d"
            type="button"
            onClick={onCtaClick}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
          >
            {ctaText}
          </motion.button>
        )}
      </div>
    </TiltCard>
  );
}

export default HowItWorksCard;
