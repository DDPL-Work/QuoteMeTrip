import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { FaqItem } from './FaqItem.jsx';

const FAQ_COL1 = [
  {
    id: 'col1-1',
    q: 'Is sending a request free?',
    a: 'Yes. Creating an itinerary, receiving quotes and comparing them is free for travellers.',
  },
  {
    id: 'col1-2',
    q: 'Which agencies receive my itinerary?',
    a: 'Only verified agencies operating in the country you choose.',
  },
  {
    id: 'col1-3',
    q: 'Can I edit my itinerary after sending?',
    a: 'Yes, until you agree to a quote. The new version is sent to all agencies again.',
  },
];

const FAQ_COL2 = [
  {
    id: 'col2-1',
    q: 'How do I pay for my holiday?',
    a: 'Directly to the agency — through their payment link, bank transfer or cash.',
  },
  {
    id: 'col2-2',
    q: 'When are contact details shared?',
    a: 'After you agree to a quote and confirm the deposit is paid.',
  },
  {
    id: 'col2-3',
    q: 'Can I print my itinerary?',
    a: 'Yes. Every itinerary and confirmation can be printed or saved as PDF.',
  },
];

export function FaqSection({ onContactClick }) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState(null);

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleContact = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      navigate('/contact');
    }
  };

  return (
    <section className="g-sec" id="g-faq">
      <div className="g-wrap">
        <HomeSectionHeader
          title="Frequently asked questions"
          subtitle="Everything you need to know before you start."
        />
        <div className="g-faq">
          <div>
            {FAQ_COL1.map(({ id, q, a }) => (
              <FaqItem
                key={id}
                question={q}
                answer={a}
                isOpen={openId === id}
                onToggle={() => toggleItem(id)}
              />
            ))}
          </div>

          <div>
            {FAQ_COL2.map(({ id, q, a }) => (
              <FaqItem
                key={id}
                question={q}
                answer={a}
                isOpen={openId === id}
                onToggle={() => toggleItem(id)}
              />
            ))}
          </div>

          <motion.div
            className="g-sup"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span
              className="ic"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#fff',
                color: '#147D33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiMessageCircle size={22} aria-hidden="true" />
            </span>
            <b style={{ fontSize: '16px' }}>Need help?</b>
            <span style={{ color: '#56625B', fontSize: '14px' }}>
              Our team answers in English and Turkish.
            </span>
            <motion.button
              className="g-btn g"
              type="button"
              onClick={handleContact}
              whileHover={shouldReduceMotion ? {} : { y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              style={{ alignSelf: 'flex-start', marginTop: '4px' }}
            >
              Contact us
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
