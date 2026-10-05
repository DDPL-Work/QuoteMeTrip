// @troublefree/ui — Public Website Components (Track B).
//
// Reusable components for the public Traveller website built with the
// Light Green (#2E9E5B) + Yellow (#F5C518) visual identity.

import { useState } from 'react';
import { useI18n, SUPPORTED_LOCALES } from '@troublefree/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="tf-lang-switcher" aria-label="Language selector">
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

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  return (
    <header className="tf-pub-header">
      <div className="tf-pub-header-container">
        <a href="/" className="tf-header-brand">
          <img
            src="/images/tfh_logo.png"
            alt="Troublefree Holiday"
            height="38"
            style={{ display: 'block' }}
          />
        </a>

        {/* Desktop Nav */}
        <nav className="tf-pub-nav-desktop" aria-label="Main Navigation">
          <a href="/destinations">{t('header.destinations', 'Destinations')}</a>
          <a href="/travel-guide">{t('header.travelGuide', 'Travel Guide')}</a>
          <a href="/agencies">{t('header.agencies', 'Agencies')}</a>
          <a href="/about">{t('header.about', 'About')}</a>
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
          <a href="/travel-guide" onClick={() => setMobileMenuOpen(false)}>
            {t('header.travelGuide', 'Travel Guide')}
          </a>
          <a href="/agencies" onClick={() => setMobileMenuOpen(false)}>
            {t('header.agencies', 'Agencies')}
          </a>
          <a href="/about" onClick={() => setMobileMenuOpen(false)}>
            {t('header.about', 'About')}
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
              alt="Troublefree Holiday"
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
              <a href="/travel-guide">{t('header.travelGuide', 'Travel Guide')}</a>
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
              <a href="/about">{t('header.about', 'About Us')}</a>
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
        <p>{t('footer.copyright', '© Troublefree Holiday. All rights reserved.')}</p>
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

export function DestinationCard({ destination }) {
  const { t } = useI18n();
  if (!destination) return null;

  return (
    <div className="tf-destination-card">
      <div className="tf-card-image-wrap">
        <img
          src={destination.image}
          alt={destination.name}
          loading="lazy"
          className="tf-card-image"
        />
        <span className="tf-card-badge">{destination.region}</span>
      </div>
      <div className="tf-card-content">
        <h3>{destination.name}</h3>
        <p className="tf-card-text">{destination.tagline || destination.description}</p>
        <a href={`/destinations/${destination.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm">
          {t('common.explore', 'Explore')} →
        </a>
      </div>
    </div>
  );
}

export function GuideCard({ guide }) {
  const { t } = useI18n();
  if (!guide) return null;

  return (
    <div className="tf-guide-card">
      <div className="tf-card-image-wrap">
        <img src={guide.coverImage} alt={guide.title} loading="lazy" className="tf-card-image" />
        <span className="tf-card-badge tf-badge-sec">{guide.category}</span>
      </div>
      <div className="tf-card-content">
        <div className="tf-card-meta">{guide.readTime}</div>
        <h3>{guide.title}</h3>
        <p className="tf-card-text">{guide.summary}</p>
        <a href={`/travel-guide/${guide.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm">
          {t('common.readMore', 'Read Article')} →
        </a>
      </div>
    </div>
  );
}

export function AgencyCard({ agency }) {
  const { t } = useI18n();
  if (!agency) return null;

  return (
    <div className="tf-agency-card">
      <div className="tf-agency-header">
        <div className="tf-agency-avatar">{agency.agencyName.charAt(0)}</div>
        <div>
          <h3>{agency.agencyName}</h3>
          <p className="tf-agency-location">
            📍 {agency.city}, {agency.country}
          </p>
        </div>
      </div>
      <p className="tf-card-text">{agency.bio}</p>
      {agency.specialties && (
        <div className="tf-agency-chips">
          {agency.specialties.map((spec) => (
            <span key={spec} className="tf-chip">
              {spec}
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
