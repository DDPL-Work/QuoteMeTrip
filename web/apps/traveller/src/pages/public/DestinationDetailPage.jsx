/**
 * Destination Detail Page (/destinations/:countrySlug/:destinationSlug) — QuoteMeTrip.
 *
 * Detailed view featuring hero image, location, description, highlights,
 * relevant travel services, related travel guides, and a prominent "Plan a Trip to <Destination>" CTA.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n, useDynamicTranslation } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getDestinationBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

const HIGHLIGHTS_TR = {
  'Hagia Sophia': 'Ayasofya Camii',
  'Bosphorus Cruise': 'Boğaz Turu',
  'Grand Bazaar': 'Kapalıçarşı',
  'Topkapi Palace': 'Topkapı Sarayı',
  'Galata Tower': 'Galata Kulesi',
  'Sultanahmet Square': 'Sultanahmet Meydanı',
  'Goreme Open Air Museum': 'Göreme Açık Hava Müzesi',
  'Love Valley & Rose Valley': 'Aşk Vadisi ve Güllüdere Vadisi',
  'Derinkuyu Underground City': 'Derinkuyu Yeraltı Şehri',
  'Uchisar Castle': 'Uçhisar Kalesi',
  'Pigeon Valley': 'Güvercinlik Vadisi',
  'Kaleici Old Town': 'Kaleiçi Tarihi Merkez',
  'Duden Waterfalls': 'Düden Şelaleleri',
  'Aspendos Roman Theater': 'Aspendos Roma Tiyatrosu',
  'Perge Ancient City': 'Perge Antik Kenti',
  'Konyaalti Beach': 'Konyaaltı Plajı',
  'White Travertine Terraces': 'Beyaz Traverten Terasları',
  'Hierapolis Ancient City': 'Hierapolis Antik Kenti',
  'Cleopatra Antique Pool': 'Kleopatra Antik Havuzu',
  'Hierapolis Roman Amphitheater': 'Hierapolis Roma Amfitiyatrosu',
  'Hierapolis Archaeology Museum': 'Hierapolis Arkeoloji Müzesi',
  'Library of Celsus': 'Celsus Kütüphanesi',
  'Great Theatre of Ephesus': 'Büyük Efes Tiyatrosu',
  'Terraced Houses': 'Yamaç Evleri',
  'Temple of Hadrian': 'Hadrian Tapınağı',
  'House of the Virgin Mary': 'Meryem Ana Evi',
  'Sirince Hilltop Village': 'Şirince Köyü',
  'Bodrum Castle': 'Bodrum Kalesi',
  'Yalikavak Marina': 'Yalıkavak Marina',
  'Bodrum Amphitheater': 'Bodrum Amfitiyatrosu',
  'Gumusluk Bay': 'Gümüşlük Koyu',
  'Sumela Monastery': 'Sümela Manastırı',
  'Uzungol Lake': 'Uzungöl',
  'Ayder Plateau': 'Ayder Yaylası',
  'Zilkale Castle': 'Zilkale',
};

export function DestinationDetailPage() {
  const params = useParams();
  const slug = params.destinationSlug || params.slug;
  const countrySlug = params.countrySlug || 'turkey';

  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getDestinationBySlug(slug, countrySlug);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Destination not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, countrySlug]);

  const destName = data?.destination?.name || 'Destination';
  usePageMetadata(
    `${destName} Travel Guide & Highlights`,
    data?.destination?.tagline || data?.destination?.description,
  );

  const planTripHref = user
    ? `/plan-trip?destination=${encodeURIComponent(destName)}`
    : `/login?redirect=${encodeURIComponent(`/plan-trip?destination=${destName}`)}`;

  const destination = data?.destination;

  const { text: translatedName } = useDynamicTranslation({
    contentType: 'travel_guide_destination',
    contentId: destination?.id || slug,
    fieldName: 'name',
    sourceText: destination?.name || '',
  });

  const { text: translatedTagline } = useDynamicTranslation({
    contentType: 'travel_guide_destination',
    contentId: destination?.id || slug,
    fieldName: 'tagline',
    sourceText: destination?.shortDescription || destination?.tagline || '',
  });

  const { text: translatedDescription } = useDynamicTranslation({
    contentType: 'travel_guide_destination',
    contentId: destination?.id || slug,
    fieldName: 'description',
    sourceText: destination?.description || '',
  });

  const localizedRegion = useMemo(() => {
    if (!destination?.region) return '';
    const keyMap = {
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
    const key = keyMap[destination.region.toLowerCase().trim()];
    return key ? t(key, destination.region) : destination.region;
  }, [destination?.region, t]);

  const localizedCountry = useMemo(() => {
    if (locale === 'tr' && (destination?.country?.toLowerCase() === 'turkey' || destination?.country?.toLowerCase() === 'türkiye')) {
      return 'Türkiye';
    }
    return destination?.country || 'Turkey';
  }, [destination?.country, locale]);

  const localizedBestTime = useMemo(() => {
    if (locale !== 'tr' || !destination?.bestTimeToVisit) return destination?.bestTimeToVisit || '';
    const months = {
      'January': 'Ocak',
      'February': 'Şubat',
      'March': 'Mart',
      'April': 'Nisan',
      'May': 'Mayıs',
      'June': 'Haziran',
      'July': 'Temmuz',
      'August': 'Ağustos',
      'September': 'Eylül',
      'October': 'Ekim',
      'November': 'Kasım',
      'December': 'Aralık',
    };
    let result = destination.bestTimeToVisit;
    for (const [en, tr] of Object.entries(months)) {
      result = result.replace(new RegExp(`\\b${en}\\b`, 'g'), tr);
    }
    return result;
  }, [destination?.bestTimeToVisit, locale]);

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>{t('destinations.notFound', 'Destination Not Found')}</h2>
        <p className="tf-card-text">{error || t('destinations.notFoundDesc', 'The requested destination does not exist.')}</p>
        <Link to="/destinations" className="tf-btn tf-btn-primary">
          {t('destinations.backToDestinations', 'Back to Destinations')}
        </Link>
      </div>
    );
  }

  const { relatedGuides, relevantServices } = data;
  const displayName = translatedName || destination.name;
  const displayTagline = translatedTagline || destination.shortDescription || destination.tagline;

  return (
    <div>
      {/* Destination Hero */}
      <section
        className="tf-detail-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.72)), url(${destination.image})`,
        }}
      >
        <div className="tf-detail-hero-content">
          <span
            className="tf-card-badge"
            style={{ position: 'static', marginBottom: '0.75rem', display: 'inline-block' }}
          >
            {localizedRegion}, {localizedCountry}
          </span>
          <h1 className="tf-detail-hero-title">
            {displayName}
          </h1>
          <p className="tf-detail-hero-tagline">
            {displayTagline}
          </p>
        </div>
      </section>

      <div className="tf-public-container">
        <PublicBreadcrumbs
          items={[
            { label: t('header.destinations', 'Destinations'), to: '/destinations' },
            { label: localizedCountry, to: `/destinations/${destination.countrySlug || 'turkey'}` },
            { label: displayName },
          ]}
        />

        <div className="tf-detail-grid">
          <div>
            <h2 style={{ fontSize: '1.8rem', marginTop: 0 }}>{t('destinations.overview', 'Overview')}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--tf-text)' }}>
              {translatedDescription || destination.description}
            </p>

            <h3 style={{ fontSize: '1.4rem', marginTop: '2.5rem' }}>{t('destinations.highlights', 'Popular Highlights & Places')}</h3>
            <ul className="tf-list" style={{ gap: '0.6rem' }}>
              {destination.popularPlaces.map((place) => (
                <li
                  key={place}
                  className="tf-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                  <strong>{locale === 'tr' && HIGHLIGHTS_TR[place] ? HIGHLIGHTS_TR[place] : place}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="tf-card tf-sticky-sidebar">
              <h3 style={{ marginTop: 0 }}>{t('destination.travelInfo', 'Travel Information')}</h3>
              <div style={{ margin: '1rem 0', fontSize: '0.95rem' }}>
                <p>
                  <strong>{t('destination.regionLabel', 'Region:')}</strong> {localizedRegion}
                </p>
                <p>
                  <strong>{t('destination.countryLabel', 'Country:')}</strong>{' '}
                  <Link to={`/destinations/${destination.countrySlug || 'turkey'}`} style={{ color: 'var(--tf-primary)' }}>
                    {localizedCountry}
                  </Link>
                </p>
                <p>
                  <strong>{t('destination.bestTimeLabel', 'Best Time to Visit:')}</strong> {localizedBestTime}
                </p>
              </div>
              <a
                href={planTripHref}
                className="tf-btn tf-btn-primary"
                style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
              >
                {locale === 'tr' ? `${displayName} İçin Rota Planla →` : `${t('destinations.planCTA', 'Plan a Trip to')} ${displayName} →`}
              </a>
            </div>
          </div>
        </div>

        {/* Relevant Travel Services */}
        {relevantServices && relevantServices.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              {t('destination.availableServices', { name: displayName }, `Available Travel Services in ${displayName}`)}
            </h2>
            <p style={{ color: 'var(--tf-text-muted)', marginBottom: '1.5rem' }}>
              {t('destination.availableServicesDesc', { name: displayName }, `Add verified local services to your custom itinerary for ${displayName}.`)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {relevantServices.map((svc) => (
                <div key={svc.id} className="tf-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{svc.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tf-text-muted)', margin: '0 0 1rem', flex: 1 }}>
                    {svc.tagline}
                  </p>
                  <Link to={`/travel-services/${svc.slug}`} className="tf-btn tf-btn-ghost tf-btn-sm" style={{ alignSelf: 'flex-start' }}>
                    {t('services.viewDetails', 'Service Details →')}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Guides */}
        {relatedGuides && relatedGuides.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
              {t('destinations.relatedGuides', 'Travel Guides for')} {displayName}
            </h2>
            <div className="tf-grid-3">
              {relatedGuides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        <CTASection
          title={locale === 'tr' ? `${displayName} İçin Seyahat Planlayın` : `${t('destinations.planCTA', 'Plan a Trip to')} ${displayName}`}
          subtitle={t('destinations.ctaSubtitle', 'Build your route including this destination and get custom agency quotations.')}
          ctaHref={planTripHref}
        />
      </div>
    </div>
  );
}

export default DestinationDetailPage;
