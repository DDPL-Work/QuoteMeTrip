import { motion, useReducedMotion } from 'framer-motion';
import { FiClipboard, FiSliders, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { TravelGuideCard } from './TravelGuideCard.jsx';
import { AgencyPromoCard } from './AgencyPromoCard.jsx';

const GUIDES = [
  {
    icon: FiClipboard,
    title: 'Istanbul city planning guide',
    description: 'Set dates and stops first, then add hotels, guides and activities per day.',
    href: '/travel-guides/istanbul',
  },
  {
    icon: FiSliders,
    title: 'Cappadocia & balloon flight guide',
    description: 'Look at what is included — hotels, vehicle, balloon — not just the total price.',
    href: '/travel-guides/cappadocia',
  },
  {
    icon: FiCreditCard,
    title: 'Ephesus & Aegean coastal routes',
    description: 'Historical marble streets, certified guides and direct safe payment.',
    href: '/travel-guides/ephesus',
  },
];

export function TravelGuideSection({ onGuideClick, onPartnerClick }) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handlePartnerClick = onPartnerClick || (() => navigate('/agencies/turkey'));

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
          subtitle="Handcrafted guides for a trouble-free trip across Turkey."
          actionText="View all travel guides →"
          onActionClick={() => navigate('/travel-guides')}
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
            <AgencyPromoCard onPartnerClick={handlePartnerClick} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default TravelGuideSection;
