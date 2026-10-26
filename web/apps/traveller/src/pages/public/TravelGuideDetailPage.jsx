/**
 * Travel Guide Detail Page (/travel-guides/:guideSlug) — QuoteMeTrip.
 *
 * Article reading layout with cover image, category badge, typography,
 * destination backlink, related guides, and a "Plan My Trip" CTA.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n, useDynamicTranslation } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getTravelGuideBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function TravelGuideDetailPage() {
  const params = useParams();
  const slug = params.guideSlug || params.slug;

  const { t } = useI18n();
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
        const res = await getTravelGuideBySlug(slug);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err?.message || 'Article not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const articleTitle = data?.guide?.title || 'Travel Guide';
  usePageMetadata(
    articleTitle,
    data?.guide?.summary || 'Read travel guide tips and itinerary suggestions from QuoteMeTrip.',
  );

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  const guide = data?.guide;

  const { text: translatedTitle } = useDynamicTranslation({
    contentType: 'travel_guide_article',
    contentId: guide?.id || slug,
    fieldName: 'title',
    sourceText: guide?.title || '',
  });

  const { text: translatedSummary } = useDynamicTranslation({
    contentType: 'travel_guide_article',
    contentId: guide?.id || slug,
    fieldName: 'summary',
    sourceText: guide?.summary || '',
  });

  const { text: translatedContent } = useDynamicTranslation({
    contentType: 'travel_guide_article',
    contentId: guide?.id || slug,
    fieldName: 'content',
    sourceText: guide?.content || '',
  });

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>{t('guide.notFound', 'Article Not Found')}</h2>
        <p className="tf-card-text">{error || t('guide.notFoundDesc', 'The requested article does not exist.')}</p>
        <Link to="/travel-guides" className="tf-btn tf-btn-primary">
          {t('guide.backToGuides', 'Back to Travel Guides')}
        </Link>
      </div>
    );
  }

  const { relatedGuides } = data;

  const categoryName = guide.category ? (
    guide.category.toLowerCase().includes('city') ? t('guide.category.cityGuide', 'City Guide') :
    guide.category.toLowerCase().includes('adventure') ? t('guide.category.adventure', 'Adventure') :
    guide.category.toLowerCase().includes('culture') ? t('guide.category.historyCulture', 'History & Culture') :
    guide.category.toLowerCase().includes('heritage') ? t('guide.category.natureHeritage', 'Nature & Heritage') :
    guide.category.toLowerCase().includes('archaeology') ? t('guide.category.archaeology', 'Archaeology') :
    guide.category.toLowerCase().includes('beach') ? t('guide.category.coastBeaches', 'Coast & Beaches') :
    guide.category
  ) : '';

  const readTimeFormatted = guide.readTime
    ? (guide.readTime.match(/\d+/)
        ? t('guide.readTime', { count: guide.readTime.match(/\d+/)[0] }, `${guide.readTime.match(/\d+/)[0]} min read`)
        : guide.readTime)
    : '';

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs
        items={[
          { label: t('header.travelGuides', 'Travel Guides'), to: '/travel-guides' },
          { label: translatedTitle || guide.title },
        ]}
      />

      <article style={{ maxWidth: '48rem', margin: '0 auto 4rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span
            className="tf-card-badge tf-badge-sec"
            style={{ position: 'static', display: 'inline-block' }}
          >
            {categoryName}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)' }}>
            {readTimeFormatted} • {t('guide.published', 'Published')} {guide.publishedAt}
          </span>
          {guide.destinationSlug && (
            <Link
              to={`/destinations/turkey/${guide.destinationSlug}`}
              style={{
                fontSize: '0.85rem',
                color: 'var(--tf-primary)',
                marginLeft: 'auto',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {t('common.explore', 'Explore Destination')} →
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem', fontWeight: 800, lineHeight: 1.25 }}>
          {translatedTitle || guide.title}
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--tf-text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          {translatedSummary || guide.summary}
        </p>

        <div
          style={{
            borderRadius: 'var(--tf-radius-md, 12px)',
            overflow: 'hidden',
            marginBottom: '2.5rem',
            height: '24rem',
          }}
        >
          <img
            src={guide.coverImage}
            alt={translatedTitle || guide.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div
          style={{
            fontSize: '1.08rem',
            lineHeight: 1.85,
            color: 'var(--tf-text)',
            whiteSpace: 'pre-line',
          }}
        >
          {translatedContent || guide.content}
        </div>
      </article>

      {/* Related Guides */}
      {relatedGuides && relatedGuides.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>{t('guide.relatedGuides', 'More Travel Guides')}</h2>
          <div className="tf-grid-3">
            {relatedGuides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      <CTASection ctaHref={planTripHref} />
    </div>
  );
}

export default TravelGuideDetailPage;
