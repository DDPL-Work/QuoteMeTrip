import { motion, useReducedMotion } from 'framer-motion';
import { FiShield, FiDollarSign, FiSliders, FiCreditCard, FiHeadphones } from 'react-icons/fi';

const TRUST_ITEMS = [
  {
    icon: FiShield,
    title: 'Verified agencies',
    desc: 'Documents checked by our team',
  },
  {
    icon: FiDollarSign,
    title: 'Free request',
    desc: 'No fee for travellers',
  },
  {
    icon: FiSliders,
    title: 'Compare offers',
    desc: 'Price, inclusions, ratings',
  },
  {
    icon: FiCreditCard,
    title: 'Pay the agency directly',
    desc: 'On the agency’s own terms',
  },
  {
    icon: FiHeadphones,
    title: 'Support',
    desc: 'We step in if needed',
  },
];

export function HeroTrustStrip() {
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
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="g-trust">
      <motion.div
        className="g-wrap"
        variants={shouldReduceMotion ? {} : containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
          <motion.div
            className="i"
            key={title}
            variants={shouldReduceMotion ? {} : itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
          >
            <motion.span className="ic" whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}>
              <Icon size={20} aria-hidden="true" />
            </motion.span>
            <p style={{ margin: 0 }}>
              <b>{title}</b>
              <br />
              <span>{desc}</span>
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default HeroTrustStrip;
