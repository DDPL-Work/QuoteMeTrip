/**
 * Travel Guide Detail Page (/travel-guides/:guideSlug) — QuoteMeTrip.
 *
 * Article reading layout with cover image, category badge, typography,
 * destination backlink, related guides, and a "Plan My Trip" CTA.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useI18n, useDynamicTranslation } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getTravelGuideBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';
import { resolveMediaUrl } from '../../lib/api.js';

export function TravelGuideDetailPage() {
  const params = useParams();
  const slug = params.guideSlug || params.slug;

  const { t } = useI18n();
  const { user } = useAuth();
  const planTripHref = user ? '/trip-request' : '/register';
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

  const guide = data?.guide;

  const articleTitle = guide?.metaTitle || guide?.title || 'Travel Guide';
  const articleDescription = guide?.metaDescription || guide?.excerpt || guide?.summary || 'Read travel guide tips and itinerary suggestions from QuoteMeTrip.';
  const canonicalUrl = guide?.canonicalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/travel-guides/${slug}` : undefined);
  const rawFeaturedImage = guide?.ogImage || guide?.coverImage || guide?.image;
  const featuredImage = resolveMediaUrl(rawFeaturedImage);

  usePageMetadata(
    articleTitle,
    articleDescription,
    {
      canonicalUrl,
      robots: guide?.metaRobots || 'index, follow',
      ogTitle: guide?.ogTitle || articleTitle,
      ogDescription: guide?.ogDescription || articleDescription,
      ogImage: featuredImage,
      twitterCard: guide?.twitterCard || 'summary_large_image',
      jsonLd: guide ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: articleDescription,
        image: featuredImage ? [featuredImage] : undefined,
        datePublished: guide.publishedAt || guide.createdAt,
        dateModified: guide.updatedAt || guide.publishedAt || guide.createdAt,
        author: {
          '@type': 'Organization',
          name: 'QuoteMeTrip Editorial Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'QuoteMeTrip',
          logo: {
            '@type': 'ImageObject',
            url: 'https://quotemetrip.com/images/tfh_logo.png',
          },
        },
      } : null,
    }
  );

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

      <article
        style={{
          maxWidth: '48rem',
          width: '100%',
          margin: '0 auto 4rem',
          boxSizing: 'border-box',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span
            className="tf-card-badge tf-badge-sec"
            style={{ position: 'static', display: 'inline-block' }}
          >
            {categoryName}
          </span>
          {readTimeFormatted && (
            <span style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)' }}>
              {readTimeFormatted}
            </span>
          )}
          {guide.publishedAt && (
            <span style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)' }}>
              {readTimeFormatted ? ' • ' : ''}{t('guide.published', 'Published')} {new Date(guide.publishedAt).toLocaleDateString()}
            </span>
          )}
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

        <h1
          style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            margin: '0 0 1rem',
            fontWeight: 800,
            lineHeight: 1.25,
            wordBreak: 'break-word',
          }}
        >
          {translatedTitle || guide.title}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            color: 'var(--tf-text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            wordBreak: 'break-word',
          }}
        >
          {translatedSummary || guide.summary}
        </p>

        {featuredImage && (
          <div
            style={{
              borderRadius: 'var(--tf-radius-md, 12px)',
              overflow: 'hidden',
              marginBottom: '2.5rem',
              width: '100%',
              maxWidth: '100%',
              aspectRatio: '16 / 9',
              maxHeight: '26rem',
              backgroundColor: '#f1f5f9',
            }}
          >
            <img
              src={featuredImage}
              alt={guide.coverImageAlt || translatedTitle || guide.title}
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        )}

        {(() => {
          const rawContent = translatedContent || guide.content || '';
          const hasHtml = /<[a-z][\s\S]*>/i.test(rawContent);

          if (hasHtml) {
            const sanitizedHtml = DOMPurify.sanitize(rawContent, {
              USE_PROFILES: { html: true },
              ADD_ATTR: ['target', 'rel', 'data-align', 'data-caption'],
            });
            return (
              <div
                className="article-body-prose"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            );
          }

          return (
            <div
              style={{
                fontSize: '1.08rem',
                lineHeight: 1.85,
                color: 'var(--tf-text)',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {rawContent}
            </div>
          );
        })()}

        <style>{`
          .article-body-prose {
            font-size: 1.1rem;
            line-height: 1.85;
            color: #1E293B;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .article-body-prose p {
            margin: 1.25rem 0;
          }
          .article-body-prose h2 {
            font-size: 1.75rem;
            font-weight: 800;
            color: #0F172A;
            margin: 2.25rem 0 0.85rem;
            letter-spacing: -0.02em;
            line-height: 1.3;
          }
          .article-body-prose h3 {
            font-size: 1.35rem;
            font-weight: 700;
            color: #1E293B;
            margin: 1.85rem 0 0.75rem;
            line-height: 1.35;
          }
          .article-body-prose h4 {
            font-size: 1.15rem;
            font-weight: 700;
            color: #334155;
            margin: 1.5rem 0 0.5rem;
          }
          .article-body-prose ul,
          .article-body-prose ol {
            padding-left: 1.75rem;
            margin: 1.25rem 0;
          }
          .article-body-prose li {
            margin-bottom: 0.5rem;
          }
          .article-body-prose blockquote {
            border-left: 4px solid var(--tf-primary, #0D9488);
            background-color: #F8FAFC;
            padding: 1rem 1.25rem;
            margin: 1.75rem 0;
            font-style: italic;
            color: #475569;
            border-radius: 0 10px 10px 0;
          }
          .article-body-prose hr {
            border: none;
            border-top: 2px solid #E2E8F0;
            margin: 2.5rem 0;
          }
          .article-body-prose a {
            color: var(--tf-primary, #0D9488);
            text-decoration: underline;
            font-weight: 600;
          }
          .article-body-prose img {
            border-radius: 10px;
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            display: block;
            margin: 2rem 0;
          }
          .article-body-prose img.align-center {
            margin-left: auto;
            margin-right: auto;
            max-width: 90%;
          }
          .article-body-prose img.align-full {
            width: 100%;
            max-width: 100%;
          }
          .article-body-prose img.align-left {
            float: left;
            margin: 0.5rem 1.75rem 1.25rem 0;
            max-width: 48%;
          }
          .article-body-prose img.align-right {
            float: right;
            margin: 0.5rem 0 1.25rem 1.75rem;
            max-width: 48%;
          }
          @media (max-width: 768px) {
            .article-body-prose img.align-left,
            .article-body-prose img.align-right {
              float: none;
              margin: 1.5rem auto;
              max-width: 100%;
            }
          }
        `}</style>
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
