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
import { TripRequestModal } from '../../components/home/TripRequestModal.jsx';
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
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleSelectScope = (newScope) => {
    setScope(newScope);
    setIsServiceModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const queryString = serializeSearchToQuery(trip, scope);
    const targetPath = `/plan-trip${queryString ? '?' + queryString : ''}`;

    if (user) {
      navigate(targetPath);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  const handleModalSubmit = (customizedTrip) => {
    setIsServiceModalOpen(false);
    setTrip((prev) => ({
      ...prev,
      country: customizedTrip.country || prev.country,
      days: customizedTrip.days || prev.days,
      daysCount: customizedTrip.daysCount || prev.daysCount,
      travellers: customizedTrip.travellers || prev.travellers,
      flexible: customizedTrip.flexible !== undefined ? customizedTrip.flexible : prev.flexible,
    }));

    const queryString = serializeSearchToQuery(customizedTrip, customizedTrip.scope || scope);
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
        setScope={handleSelectScope}
        onSubmit={handleSearchSubmit}
        isSubmitting={isSubmitting}
      />

      {/* SERVICE-SPECIFIC MODAL POPUP */}
      <TripRequestModal
        isOpen={isServiceModalOpen}
        serviceName={scope}
        initialData={trip}
        onClose={() => setIsServiceModalOpen(false)}
        onSubmit={handleModalSubmit}
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
