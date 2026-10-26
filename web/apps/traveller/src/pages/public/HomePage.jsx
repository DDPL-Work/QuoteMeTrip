import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context.js';
import { serializeSearchToQuery } from '../../features/trip/search-trip-mapping.js';
import { HomeHero } from '../../components/home/HomeHero.jsx';
import { HeroTrustStrip } from '../../components/home/HeroTrustStrip.jsx';
import { PopularRoutesSection } from '../../components/home/PopularRoutesSection.jsx';
import { HowItWorksSection } from '../../components/home/HowItWorksSection.jsx';
import { TravelGuideSection } from '../../components/home/TravelGuideSection.jsx';
import { FaqSection } from '../../components/home/FaqSection.jsx';
import './HomePage.css';

/**
 * PublicHomePage Component
 * Modernized, highly maintainable composition root for the Traveller Public Homepage.
 * Composes dedicated section components with central Framer Motion & 3D tilt interactions.
 */
export function PublicHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState({
    country: 'Türkiye',
    days: [{ date: '' }],
    daysCount: 7,
    travellers: 2,
    flexible: false,
    suggest: false,
  });
  const [scope, setScope] = useState('Blue Cruise');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const queryString = serializeSearchToQuery(trip, scope);
    const targetPath = `/plan-trip${queryString ? '?' + queryString : ''}`;

    if (user) {
      navigate(targetPath);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  return (
    <div className="g">
      {/* 1. HERO SECTION & FLOATING SEARCH PANEL */}
      <HomeHero
        trip={trip}
        setTrip={setTrip}
        scope={scope}
        setScope={setScope}
        onSubmit={handleSearchSubmit}
        isSubmitting={isSubmitting}
      />

      {/* 2. TRUST SECTION */}
      <HeroTrustStrip />

      {/* 3. POPULAR ROUTES */}
      <PopularRoutesSection />

      {/* 4. HOW IT WORKS */}
      <HowItWorksSection />

      {/* 5. TRAVEL GUIDE & AGENCIES */}
      <TravelGuideSection />

      {/* 6. FAQ */}
      <FaqSection />
    </div>
  );
}

export default PublicHomePage;
