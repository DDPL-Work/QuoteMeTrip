import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { PopularRouteCard } from './PopularRouteCard.jsx';
import { DEFAULT_POPULAR_ROUTES } from './popular-routes-data.js';

export { DEFAULT_POPULAR_ROUTES };

/**
 * PopularRoutesSection Component
 * Staggered grid section displaying popular route cards.
 */
export function PopularRoutesSection({
  routes = DEFAULT_POPULAR_ROUTES,
  title = 'Popular routes',
  subtitle = 'Where travellers are planning their next trip.',
  onSelectRoute,
  onViewAll,
}) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleRouteClick = (route) => {
    if (onSelectRoute) {
      onSelectRoute(route);
    } else {
      navigate(`/plan-trip?destination=${encodeURIComponent(route.name)}`);
    }
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/destinations');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="g-sec" id="g-routes">
      <div className="g-wrap">
        <HomeSectionHeader
          title={title}
          subtitle={subtitle}
          actionText="View all routes →"
          onActionClick={handleViewAllClick}
        />
        <motion.div
          className="g-routes"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, threshold: 0.15 }}
        >
          {routes.map((route, i) => (
            <motion.div key={route.id || i} variants={shouldReduceMotion ? {} : cardVariants}>
              <PopularRouteCard route={route} index={i} onSelectRoute={handleRouteClick} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default PopularRoutesSection;
