import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@troublefree/i18n';

export function JourneyStatusSection() {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  const statusItems = [
    [t('journey.status.draft', 'Draft'), t('journey.status.draftDesc', 'You are still planning')],
    [t('journey.status.sent', 'Sent'), t('journey.status.sentDesc', 'Agencies in your country notified')],
    [t('journey.status.quotesReceived', 'Quotes received'), t('journey.status.quotesReceivedDesc', 'Compare the offers')],
    [t('journey.status.agreed', 'Agreed'), t('journey.status.agreedDesc', 'Price locked, quoting closed')],
    [t('journey.status.depositPaid', 'Deposit paid'), t('journey.status.depositPaidDesc', 'Contacts unlocked')],
    [t('journey.status.confirmed', 'Confirmed'), t('journey.status.confirmedDesc', 'Written confirmation + PDF')],
  ];

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
      <div className="jt">{t('journey.status.title', 'Your trip status, from start to finish')}</div>
      <motion.ol
        variants={shouldReduceMotion ? {} : containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, threshold: 0.2 }}
      >
        {statusItems.map(([title, desc], i) => (
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
