/**
 * Travel Guide Detail Page (/travel-guide/:slug) — Track B.
 *
 * Article reading layout with cover image, category badge, typography,
 * related guides, and a "Plan My Trip" CTA.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@troublefree/i18n';
import { GuideCard, CTASection } from '@troublefree/ui';
import { getTravelGuideBySlug } from '../../services/public-api.js';
import { useAuth } from '../../features/auth/auth-context.js';

export function TravelGuideDetailPage() {
  const { slug } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

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

  if (loading) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !data?.guide) {
    return (
      <div className="tf-public-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2>Article Not Found</h2>
        <p className="tf-card-text">{error || 'The requested article does not exist.'}</p>
        <a href="/travel-guide" className="tf-btn tf-btn-primary">
          Back to Travel Guide
        </a>
      </div>
    );
  }

  const { guide, relatedGuides } = data;

  return (
    <div className="tf-public-container">
      <article style={{ maxWidth: '48rem', margin: '0 auto 4rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span
            className="tf-card-badge tf-badge-sec"
            style={{ position: 'static', display: 'inline-block' }}
          >
            {guide.category}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', marginLeft: '1rem' }}>
            {guide.readTime} • Published {guide.publishedAt}
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem', fontWeight: 800, lineHeight: 1.2 }}>
          {guide.title}
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--tf-text-muted)',
            lineHeight: 1.5,
            marginBottom: '2rem',
          }}
        >
          {guide.summary}
        </p>

        <div
          style={{
            borderRadius: 'var(--tf-radius-md)',
            overflow: 'hidden',
            marginBottom: '2.5rem',
            height: '22rem',
          }}
        >
          <img
            src={guide.coverImage}
            alt={guide.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--tf-text)',
            whiteSpace: 'pre-line',
          }}
        >
          {guide.content}
        </div>
      </article>

      {/* Related Guides */}
      {relatedGuides && relatedGuides.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>More Travel Articles</h2>
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
