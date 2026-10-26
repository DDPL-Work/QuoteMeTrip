import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { HomeSectionHeader } from './HomeSectionHeader.jsx';
import { HowItWorksCard } from './HowItWorksCard.jsx';
import { JourneyStatusSection } from './JourneyStatusSection.jsx';

export function HowItWorksSection() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
          title={t('home.howItWorks.title', 'How QuoteMeTrip works')}
          subtitle={t(
            'home.howItWorks.subtitle',
            'Three steps from a rough idea to a confirmed, paid-for trip — with no booking fees.',
          )}
          actionText={t('home.howItWorks.learnMore', 'Learn more →')}
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
              badgeText={t('home.howItWorks.step1Badge', 'STEP 1 · 5 MINUTES')}
              title={t('home.howItWorks.card1Title', 'Build your itinerary, day by day')}
              description={t(
                'home.howItWorks.card1Desc',
                'Pick the country, then give every day a date and a destination. Say what you need on each day — or leave it open and let the agency plan it.',
              )}
              ticks={[
                t('home.howItWorks.step1Tick1', 'Add, remove and reorder days as you like'),
                t('home.howItWorks.step1Tick2', 'Per day: activity, guide, hotel and hotel class'),
                t('home.howItWorks.step1Tick3', 'Travellers, luggage and any special requests'),
                t('home.howItWorks.step1Tick4', 'Your name, email and WhatsApp come from your profile'),
              ]}
              tip={t('home.howItWorks.step1Tip', 'Not sure of the route? Tick “let agencies suggest the route” and they will propose one.')}
              ctaText={t('home.howItWorks.step1Cta', 'Build my itinerary')}
              onCtaClick={() => navigate('/plan-trip')}
            />
          </motion.div>

          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <HowItWorksCard
              stepNumber={2}
              badgeText={t('home.howItWorks.step2Badge', 'STEP 2 · 24–48 HOURS')}
              title={t('home.howItWorks.card2Title', 'Receive quotations from local agencies')}
              description={t(
                'home.howItWorks.card2Desc',
                'Your itinerary goes only to verified agencies in that country. They reply with a full price and exactly what it includes.',
              )}
              ticks={[
                t('home.howItWorks.step2Tick1', 'Compare price, inclusions and star rating side by side'),
                t('home.howItWorks.step2Tick2', 'Ask questions in chat — contact details stay hidden'),
                t('home.howItWorks.step2Tick3', 'Change your plan any time; every agency gets the new version'),
                t('home.howItWorks.step2Tick4', 'Old quotes are marked outdated so you never compare the wrong one'),
              ]}
              tip={t('home.howItWorks.step2Tip', 'Free for travellers. Agencies pay QuoteMeTrip, never you.')}
              ctaText={t('home.howItWorks.step2Cta', 'See my quotes')}
              onCtaClick={() => navigate('/plan-trip')}
            />
          </motion.div>

          <motion.div variants={shouldReduceMotion ? {} : cardVariants}>
            <HowItWorksCard
              stepNumber={3}
              badgeText={t('home.howItWorks.step3Badge', 'STEP 3 · SAME DAY')}
              title={t('home.howItWorks.card3Title', 'Agree, pay directly, get confirmed')}
              description={t(
                'home.howItWorks.card3Desc',
                'Accept the quote you like. The agency sends a payment link and you pay them directly — QuoteMeTrip never touches your money.',
              )}
              ticks={[
                t('home.howItWorks.step3Tick1', 'Agreeing closes quoting and locks your price'),
                t('home.howItWorks.step3Tick2', 'Tick “deposit paid” with the amount and reference'),
                t('home.howItWorks.step3Tick3', 'Contacts unlock for both sides straight away'),
                t('home.howItWorks.step3Tick4', 'You get a written confirmation with a Print / PDF copy'),
              ]}
              tip={t('home.howItWorks.step3Tip', 'After the trip you rate the agency from 1 to 5 stars, which helps the next traveller.')}
              ctaText={t('home.howItWorks.step3Cta', 'See the booking steps')}
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
            <b>{t('home.whyUs.feature1Title', 'Every day planned. Every quote compared.')}</b>
            <span>{t('home.hero.subtitle', 'Real itineraries, priced by agencies who live there.')}</span>
          </div>
        </motion.div>

        {/* Status timeline */}
        <JourneyStatusSection />
      </div>
    </section>
  );
}

export default HowItWorksSection;
