import { motion, useReducedMotion } from 'framer-motion';
import { FiClipboard, FiSliders, FiCreditCard } from 'react-icons/fi';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { TravelGuideCard } from './TravelGuideCard.jsx';
import { AgencyPromoCard } from './AgencyPromoCard.jsx';

const GUIDES = [
  {
    icon: FiClipboard,
    title: 'How to plan day by day',
    description: 'Set dates and stops first, then add hotels, guides and activities per day.',
    href: '#guide',
  },
  {
    icon: FiSliders,
    title: 'Comparing quotes properly',
    description: 'Look at what is included — hotels, vehicle, guide — not just the total price.',
    href: '#guide',
  },
  {
    icon: FiCreditCard,
    title: 'Paying the agency safely',
    description: 'Use the agency’s payment link or bank transfer and keep your receipt.',
    href: '#guide',
  },
];

export function TravelGuideSection({ onGuideClick, onPartnerClick }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <section className="g-sec">
      <div className="g-wrap">
        <HomeSectionHeader
          title="With you while you plan"
          subtitle="Simple guides for a trouble-free trip."
        />
        <motion.div
          className="g-help"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, threshold: 0.15 }}
        >
          {GUIDES.map((guide, idx) => (
            <motion.div key={idx} variants={shouldReduceMotion ? {} : cardVariants}>
              <TravelGuideCard
                icon={guide.icon}
                title={guide.title}
                description={guide.description}
                href={guide.href}
                onClick={onGuideClick}
              />
            </motion.div>
          ))}
          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <AgencyPromoCard onPartnerClick={onPartnerClick} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default TravelGuideSection;
