import React, { useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

/**
 * FaqItem Component
 * Accessible controlled accordion item with height animation and chevron rotation.
 */
export function FaqItem({ question, answer, isOpen, onToggle }) {
  const shouldReduceMotion = useReducedMotion();
  const contentId = useId();
  const buttonId = useId();

  return (
    <div
      className="g-faq-item"
      style={{
        background: '#fff',
        border: '1px solid #eee9df',
        borderRadius: '12px',
        padding: '0 16px',
        marginBottom: '10px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 0',
          border: 0,
          background: 'transparent',
          fontWeight: 600,
          fontSize: '14.5px',
          color: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
          style={{ color: '#147D33', display: 'inline-flex', flexShrink: 0 }}
        >
          <FiChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            initial={
              shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }
            }
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ margin: '0 0 16px', color: '#56625b', fontSize: '14px', lineHeight: 1.55 }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FaqItem;
