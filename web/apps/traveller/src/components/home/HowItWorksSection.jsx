import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { HowItWorksCard } from './HowItWorksCard.jsx';
import { JourneyStatusSection } from './JourneyStatusSection.jsx';

export function HowItWorksSection() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleStartStep1 = () => {
    navigate('/plan-trip');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="g-sec" id="g-how">
      <div className="g-wrap">
        <HomeSectionHeader
          title="How QuoteMeTrip works"
          subtitle="Three steps from a rough idea to a confirmed, paid-for trip — with no booking fees."
          actionText="Learn more →"
          onActionClick={() => navigate('/how-it-works')}
        />

        <motion.div
          className="g-steps3"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, threshold: 0.15 }}
        >
          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <HowItWorksCard
              stepNumber={1}
              badgeText="STEP 1 · 5 MINUTES"
              title="Build your itinerary, day by day"
              description="Pick the country, then give every day a date and a destination. Say what you need on each day — or leave it open and let the agency plan it."
              ticks={[
                'Add, remove and reorder days as you like',
                'Per day: activity, guide, hotel and hotel class',
                'Travellers, luggage and any special requests',
                'Your name, email and WhatsApp come from your profile',
              ]}
              tip="Not sure of the route? Tick “let agencies suggest the route” and they will propose one."
              ctaText="Build my itinerary"
              onCtaClick={() => navigate('/plan-trip')}
            />
          </motion.div>

          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <HowItWorksCard
              stepNumber={2}
              badgeText="STEP 2 · 24–48 HOURS"
              title="Receive quotes from local agencies"
              description="Your itinerary goes only to verified agencies in that country. They reply with a full price and exactly what it includes."
              ticks={[
                'Compare price, inclusions and star rating side by side',
                'Ask questions in chat — contact details stay hidden',
                'Change your plan any time; every agency gets the new version',
                'Old quotes are marked outdated so you never compare the wrong one',
              ]}
              tip="Free for travellers. Agencies pay QuoteMeTrip, never you."
              ctaText="See my quotes"
              onCtaClick={() => navigate('/plan-trip')}
            />
          </motion.div>

          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <HowItWorksCard
              stepNumber={3}
              badgeText="STEP 3 · SAME DAY"
              title="Agree, pay the agency, get confirmed"
              description="Accept the quote you like. The agency sends a payment link and you pay them directly — QuoteMeTrip never touches your money."
              ticks={[
                'Agreeing closes quoting and locks your price',
                'Tick “deposit paid” with the amount and reference',
                'Contacts unlock for both sides straight away',
                'You get a written confirmation with a Print / PDF copy',
              ]}
              tip="After the trip you rate the agency from 1 to 5 stars, which helps the next traveller."
              ctaText="See the booking steps"
              onCtaClick={() => navigate('/plan-trip')}
            />
          </motion.div>
        </motion.div>

        {/* Photoband */}
        <motion.div
          className="g-photoband"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, threshold: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.img
            src="/images/how.png"
            alt="How it works — every day planned, every quote compared"
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="cap">
            <b>Every day planned. Every quote compared.</b>
            <span>Real itineraries, priced by agencies who live there.</span>
          </div>
        </motion.div>

        {/* Status timeline */}
        <JourneyStatusSection />
      </div>
    </section>
  );
}

export default HowItWorksSection;
