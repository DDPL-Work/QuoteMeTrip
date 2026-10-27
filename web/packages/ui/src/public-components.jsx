// @troublefree/ui — Public Website Components (Track B).
//
// Reusable components for the public Traveller website built with the
// Light Green (#2E9E5B) + Yellow (#F5C518) visual identity.

import { useState, useEffect } from 'react';
import { FiGlobe } from 'react-icons/fi';
import { useI18n, SUPPORTED_LOCALES, useDynamicTranslation } from '@troublefree/i18n';

export function LanguageSwitcher({ variant = '' }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`tf-lang-switcher ${variant}`.trim()} aria-label="Language selector">
      <FiGlobe className="tf-lang-globe-icon" size={13} />
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`tf-lang-btn ${locale === loc ? 'active' : ''}`}
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function PublicHeader({ user, onSignOut }) {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  return (
    <header className="tf-pub-header">
      <div className="tf-pub-header-container">
        <a href="/" className="tf-header-brand">
          <img
            src="/images/tfh_logo.png"
            alt="QuoteMeTrip"
            height="38"
            style={{ display: 'block', maxWidth: '100%', height: 'auto', maxHeight: '38px' }}
          />
        </a>

        {/* Desktop Nav */}
        <nav className="tf-pub-nav-desktop" aria-label="Main Navigation">
          <a href="/destinations">{t('header.destinations', 'Destinations')}</a>
          <a href="/travel-services">{t('header.travelServices', 'Travel Services')}</a>
          <a href="/travel-guides">{t('header.travelGuides', 'Travel Guides')}</a>
          <a href="/agencies">{t('header.agencies', 'Agencies')}</a>
          <a href="/how-it-works">{t('header.howItWorks', 'How It Works')}</a>
          <a href="/about-us">{t('header.aboutUs', 'About Us')}</a>
          <a href="/contact">{t('header.contact', 'Contact')}</a>
        </nav>

        {/* Desktop Right Actions */}
        <div className="tf-pub-actions-desktop">
          <LanguageSwitcher />
          {user ? (
            <>
              <a href="/plan-trip" className="tf-nav-link">
                {t('header.myTrips', 'My Trips')}
              </a>
              {onSignOut && (
                <button type="button" className="tf-btn tf-btn-ghost" onClick={onSignOut}>
                  {t('header.signOut', 'Sign Out')}
                </button>
              )}
            </>
          ) : (
            <>
              <a href="/login" className="tf-nav-link">
                {t('header.login', 'Sign In')}
              </a>
              <a href="/register" className="tf-nav-link tf-nav-link-register">
                {t('header.register', 'Register')}
              </a>
            </>
          )}
          <a href={planTripHref} className="tf-btn tf-btn-primary tf-btn-cta">
            {t('header.planTrip', 'Plan My Trip')}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="tf-mobile-toggle"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="tf-hamburger-line"></span>
          <span className="tf-hamburger-line"></span>
          <span className="tf-hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav className="tf-pub-nav-mobile" aria-label="Mobile Navigation">
          <a href="/" onClick={() => setMobileMenuOpen(false)}>
            {t('header.home', 'Home')}
          </a>
          <a href="/destinations" onClick={() => setMobileMenuOpen(false)}>
            {t('header.destinations', 'Destinations')}
          </a>
          <a href="/travel-services" onClick={() => setMobileMenuOpen(false)}>
            {t('header.travelServices', 'Travel Services')}
          </a>
          <a href="/travel-guides" onClick={() => setMobileMenuOpen(false)}>
            {t('header.travelGuides', 'Travel Guides')}
          </a>
          <a href="/agencies" onClick={() => setMobileMenuOpen(false)}>
            {t('header.agencies', 'Agencies')}
          </a>
          <a href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>
            {t('header.howItWorks', 'How It Works')}
          </a>
          <a href="/about-us" onClick={() => setMobileMenuOpen(false)}>
            {t('header.aboutUs', 'About Us')}
          </a>
          <a href="/contact" onClick={() => setMobileMenuOpen(false)}>
            {t('header.contact', 'Contact')}
          </a>
          <hr className="tf-divider" />
          <div className="tf-mobile-actions">
            <LanguageSwitcher />
            {user ? (
              <>
                <a href="/plan-trip" className="tf-btn tf-btn-ghost">
                  {t('header.myTrips', 'My Trips')}
                </a>
                {onSignOut && (
                  <button type="button" className="tf-btn tf-btn-ghost" onClick={onSignOut}>
                    {t('header.signOut', 'Sign Out')}
                  </button>
                )}
              </>
            ) : (
              <>
                <a href="/login" className="tf-btn tf-btn-ghost">
                  {t('header.login', 'Sign In')}
                </a>
                <a href="/register" className="tf-btn tf-btn-ghost">
                  {t('header.register', 'Register')}
                </a>
              </>
            )}
            <a href={planTripHref} className="tf-btn tf-btn-primary">
              {t('header.planTrip', 'Plan My Trip')}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="tf-pub-footer">
      <div className="tf-pub-footer-container">
        <div className="tf-footer-brand">
          <a href="/" className="tf-header-brand">
            <img
              src="/images/tfh_logo.png"
              alt="QuoteMeTrip"
              height="34"
              style={{ display: 'block' }}
            />
          </a>
          <p className="tf-footer-tagline">
            Route-first trip planning and competitive agency quotations for seamless holidays in
            Turkey.
          </p>
        </div>

        <div className="tf-footer-column">
          <h4>Navigation</h4>
          <ul>
            <li>
              <a href="/">{t('header.home', 'Home')}</a>
            </li>
            <li>
              <a href="/destinations">{t('header.destinations', 'Destinations')}</a>
            </li>
            <li>
              <a href="/destinations/turkey">{t('footer.turkey', 'Turkey')}</a>
            </li>
            <li>
              <a href="/travel-services">{t('header.travelServices', 'Travel Services')}</a>
            </li>
            <li>
              <a href="/travel-guides">{t('header.travelGuides', 'Travel Guides')}</a>
            </li>
            <li>
              <a href="/agencies">{t('header.agencies', 'Agencies')}</a>
            </li>
          </ul>
        </div>

        <div className="tf-footer-column">
          <h4>Company</h4>
          <ul>
            <li>
              <a href="/how-it-works">{t('header.howItWorks', 'How It Works')}</a>
            </li>
            <li>
              <a href="/about-us">{t('header.aboutUs', 'About Us')}</a>
            </li>
            <li>
              <a href="/contact">{t('header.contact', 'Contact Us')}</a>
            </li>
            <li>
              <a href="/login">{t('header.login', 'Sign In')}</a>
            </li>
            <li>
              <a href="/register">{t('header.register', 'Register')}</a>
            </li>
          </ul>
        </div>

        <div className="tf-footer-column">
          <h4>Language</h4>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="tf-footer-bottom">
        <p>{t('footer.copyright', '© QuoteMeTrip. All rights reserved.')}</p>
      </div>
    </footer>
  );
}

export function SectionHeading({ title, subtitle, centered = true }) {
  return (
    <div className={`tf-section-heading ${centered ? 'centered' : ''}`}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div className="tf-heading-accent"></div>
    </div>
  );
}

function formatCategory(category, t) {
  if (!category) return '';
  const lower = String(category).toLowerCase().trim();
  if (lower === 'city guide') return t('guide.category.cityGuide', 'City Guide');
  if (lower === 'adventure') return t('guide.category.adventure', 'Adventure');
  if (lower === 'history & culture' || lower === 'history culture') return t('guide.category.historyCulture', 'History & Culture');
  if (lower === 'nature & heritage' || lower === 'nature heritage') return t('guide.category.natureHeritage', 'Nature & Heritage');
  if (lower === 'archaeology') return t('guide.category.archaeology', 'Archaeology');
  if (lower === 'coast & beaches' || lower === 'coast beaches') return t('guide.category.coastBeaches', 'Coast & Beaches');
  return category;
}

function formatReadTime(readTime, t) {
  if (!readTime) return '';
  const match = String(readTime).match(/\d+/);
  if (match) {
    return t('guide.readTime', { count: match[0] }, `${match[0]} min read`);
  }
  return readTime;
}

export function DestinationCard({ destination, translatedName, translatedTagline }) {
  const { t } = useI18n();

  const { text: autoName } = useDynamicTranslation({
    contentType: 'travel_guide_destination',
    contentId: destination?.id || destination?.slug,
    fieldName: 'name',
    sourceText: destination?.name || '',
  });

  const { text: autoTagline } = useDynamicTranslation({
    contentType: 'travel_guide_destination',
    contentId: destination?.id || destination?.slug,
    fieldName: 'tagline',
    sourceText: destination?.shortDescription || destination?.tagline || destination?.description || '',
  });

  if (!destination) return null;

  const displayName = translatedName || autoName || destination.name;
  const displayTagline = translatedTagline || autoTagline || destination.tagline || destination.description;
  const regionLower = (destination.region || '').toLowerCase().trim();
  const regionKeyMap = {
    'aegean': 'destinations.region.aegean',
    'ege': 'destinations.region.aegean',
    'central anatolia': 'destinations.region.centralAnatolia',
    'iç anadolu': 'destinations.region.centralAnatolia',
    'mediterranean': 'destinations.region.mediterranean',
    'akdeniz': 'destinations.region.mediterranean',
    'marmara': 'destinations.region.marmara',
    'black sea': 'destinations.region.blackSea',
    'karadeniz': 'destinations.region.blackSea',
  };
  const regionLabel = regionKeyMap[regionLower] ? t(regionKeyMap[regionLower], destination.region) : destination.region;

  return (
    <div className="tf-destination-card">
      <div className="tf-card-image-wrap">
        <img
          src={destination.image}
          alt={displayName}
          loading="lazy"
          className="tf-card-image"
        />
        <span className="tf-card-badge">{regionLabel}</span>
      </div>
      <div className="tf-card-content">
        <h3>{displayName}</h3>
        <p className="tf-card-text">{displayTagline}</p>
        <a href={`/destinations/${destination.countrySlug || 'turkey'}/${destination.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm">
          {t('common.explore', 'Explore')} →
        </a>
      </div>
    </div>
  );
}

export function GuideCard({ guide, translatedTitle, translatedSummary }) {
  const { t } = useI18n();

  const { text: autoTitle } = useDynamicTranslation({
    contentType: 'travel_guide_article',
    contentId: guide?.id || guide?.slug,
    fieldName: 'title',
    sourceText: guide?.title || '',
  });

  const { text: autoSummary } = useDynamicTranslation({
    contentType: 'travel_guide_article',
    contentId: guide?.id || guide?.slug,
    fieldName: 'summary',
    sourceText: guide?.summary || '',
  });

  if (!guide) return null;

  const displayTitle = translatedTitle || autoTitle || guide.title;
  const displaySummary = translatedSummary || autoSummary || guide.summary;
  const displayCategory = formatCategory(guide.category, t);
  const displayReadTime = formatReadTime(guide.readTime, t);

  return (
    <div className="tf-guide-card">
      <div className="tf-card-image-wrap">
        <img src={guide.coverImage} alt={displayTitle} loading="lazy" className="tf-card-image" />
        <span className="tf-card-badge tf-badge-sec">{displayCategory}</span>
      </div>
      <div className="tf-card-content">
        <div className="tf-card-meta">{displayReadTime}</div>
        <h3>{displayTitle}</h3>
        <p className="tf-card-text">{displaySummary}</p>
        <a href={`/travel-guides/${guide.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm">
          {t('guide.readArticle', 'Read Article')} →
        </a>
      </div>
    </div>
  );
}

function formatSpecialty(spec, t) {
  if (!spec) return '';
  const keyMap = {
    'cultural tours': 'agency.specialty.culturalTours',
    'private drivers': 'agency.specialty.privateDrivers',
    'vip transfers': 'agency.specialty.vipTransfers',
    'luxury hotels': 'agency.specialty.luxuryHotels',
    'coastal routes': 'agency.specialty.coastalRoutes',
    'yacht charters': 'agency.specialty.yachtCharters',
    'beach resorts': 'agency.specialty.beachResorts',
    'family holidays': 'agency.specialty.familyHolidays',
    'balloon rides': 'agency.specialty.balloonRides',
    'cave hotels': 'agency.specialty.caveHotels',
    'trekking': 'agency.specialty.trekking',
    'photography tours': 'agency.specialty.photographyTours',
    'ancient sites': 'agency.specialty.ancientSites',
    'wine & culinary': 'agency.specialty.wineCulinary',
    'boutique escapes': 'agency.specialty.boutiqueEscapes',
    'self-drive routes': 'agency.specialty.selfDriveRoutes',
  };
  const key = keyMap[String(spec).toLowerCase().trim()];
  return key ? t(key, spec) : spec;
}

export function AgencyCard({ agency, translatedBio }) {
  const { t, locale } = useI18n();

  const { text: autoBio } = useDynamicTranslation({
    contentType: 'agency_profile',
    contentId: agency?.id,
    fieldName: 'bio',
    sourceText: agency?.bio || '',
  });

  if (!agency) return null;

  const displayBio = translatedBio || autoBio || agency.bio;
  const displayCountry =
    locale === 'tr' && agency.country?.toLowerCase() === 'turkey'
      ? 'Türkiye'
      : agency.country;

  return (
    <div className="tf-agency-card">
      <div className="tf-agency-header">
        <div className="tf-agency-avatar">{agency.agencyName.charAt(0)}</div>
        <div>
          <h3>{agency.agencyName}</h3>
          <p className="tf-agency-location">
            📍 {agency.city}, {displayCountry}
          </p>
        </div>
      </div>
      <p className="tf-card-text">{displayBio}</p>
      {agency.specialties && (
        <div className="tf-agency-chips">
          {agency.specialties.map((spec) => (
            <span key={spec} className="tf-chip">
              {formatSpecialty(spec, t)}
            </span>
          ))}
        </div>
      )}
      <div className="tf-card-footer">
        <a href={`/agencies/${agency.id}`} className="tf-btn tf-btn-ghost tf-btn-sm">
          {t('common.viewProfile', 'View Agency')} →
        </a>
      </div>
    </div>
  );
}

export function CTASection({ title, subtitle, ctaHref = '/login?redirect=/plan-trip' }) {
  const { t } = useI18n();

  return (
    <section className="tf-cta-section">
      <div className="tf-cta-content">
        <h2>{title || t('home.cta.title', 'Ready to Plan Your Trip?')}</h2>
        <p>
          {subtitle ||
            t(
              'home.cta.subtitle',
              'Build your route now and start receiving competitive agency quotations.',
            )}
        </p>
        <a href={ctaHref} className="tf-btn tf-btn-secondary tf-btn-lg">
          {t('home.cta.button', 'Plan My Trip')}
        </a>
      </div>
    </section>
  );
}
