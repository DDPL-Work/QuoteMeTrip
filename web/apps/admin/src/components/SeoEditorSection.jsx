import { useState, useMemo } from 'react';
import {
  FiGlobe,
  FiSearch,
  FiShare2,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiKey,
  FiCpu,
} from 'react-icons/fi';
import { apiBaseUrl } from '../services/api.js';

export function SeoEditorSection({
  title = '',
  slug = '',
  excerpt = '',
  content = '',
  coverImage = '',
  coverImageAlt = '',
  seoValues = {},
  onChangeField,
}) {
  const [activePreviewTab, setActivePreviewTab] = useState('google'); // 'google' | 'social'

  const metaTitle = seoValues.metaTitle !== undefined ? seoValues.metaTitle : '';
  const metaDescription = seoValues.metaDescription !== undefined ? seoValues.metaDescription : '';
  const canonicalUrl = seoValues.canonicalUrl !== undefined ? seoValues.canonicalUrl : '';
  const metaRobots = seoValues.metaRobots || 'index, follow';
  const ogTitle = seoValues.ogTitle !== undefined ? seoValues.ogTitle : '';
  const ogDescription = seoValues.ogDescription !== undefined ? seoValues.ogDescription : '';
  const ogImage = seoValues.ogImage !== undefined ? seoValues.ogImage : '';
  const twitterCard = seoValues.twitterCard || 'summary_large_image';
  const focusKeyword = seoValues.focusKeyword || '';
  const relatedKeywords = seoValues.relatedKeywords || '';

  // Effective Display Values with Smart Fallbacks
  const effectiveTitle = metaTitle.trim() || title.trim() || 'Untitled Travel Article';
  const effectiveDescription =
    metaDescription.trim() ||
    excerpt.trim() ||
    (content ? content.replace(/<[^>]*>?/gm, '').slice(0, 160) : '') ||
    'Discover travel tips, local insights, and itinerary recommendations on QuoteMeTrip.';
  const effectiveOgTitle = ogTitle.trim() || effectiveTitle;
  const effectiveOgDescription = ogDescription.trim() || effectiveDescription;
  const effectiveOgImage = ogImage.trim() || coverImage.trim();

  const publicUrl = `https://quotemetrip.com/travel-guides/${slug || 'article-slug'}`;

  // Non-blocking Editorial SEO Analysis
  const analysis = useMemo(() => {
    const checks = [];

    // Title length (optimal 45-65 chars)
    const titleLen = effectiveTitle.length;
    if (titleLen === 0) {
      checks.push({ type: 'warning', text: 'Article title is required.' });
    } else if (titleLen < 30) {
      checks.push({ type: 'info', text: `Title is short (${titleLen}/60 chars). Aim for 45–65 characters.` });
    } else if (titleLen > 65) {
      checks.push({ type: 'warning', text: `Title is long (${titleLen}/60 chars). Google may truncate it.` });
    } else {
      checks.push({ type: 'good', text: `Title length is optimal (${titleLen} chars).` });
    }

    // Meta description length (optimal 120-160 chars)
    const descLen = effectiveDescription.length;
    if (!metaDescription && !excerpt) {
      checks.push({ type: 'warning', text: 'Missing dedicated Meta Description or excerpt.' });
    } else if (descLen < 100) {
      checks.push({ type: 'info', text: `Meta description is short (${descLen}/160 chars).` });
    } else if (descLen > 165) {
      checks.push({ type: 'warning', text: `Meta description exceeds 160 chars (${descLen}).` });
    } else {
      checks.push({ type: 'good', text: `Meta description length is optimal (${descLen} chars).` });
    }

    // Slug check
    if (!slug) {
      checks.push({ type: 'warning', text: 'URL Slug is missing.' });
    } else if (slug.includes(' ') || /[^a-z0-9-]/.test(slug)) {
      checks.push({ type: 'warning', text: 'Slug contains spaces or invalid characters. Use lowercase and hyphens.' });
    } else {
      checks.push({ type: 'good', text: `Clean SEO-friendly slug: /${slug}` });
    }

    // Featured image & Alt
    if (!coverImage) {
      checks.push({ type: 'info', text: 'No featured cover image added.' });
    } else if (!coverImageAlt) {
      checks.push({ type: 'warning', text: 'Featured image is missing descriptive Alt text for accessibility.' });
    } else {
      checks.push({ type: 'good', text: 'Featured image has accessible alt text.' });
    }

    // Focus Keyword presence
    if (focusKeyword) {
      const kwLower = focusKeyword.toLowerCase().trim();
      const inTitle = effectiveTitle.toLowerCase().includes(kwLower);
      const inDesc = effectiveDescription.toLowerCase().includes(kwLower);

      if (inTitle && inDesc) {
        checks.push({ type: 'good', text: `Focus keyword "${focusKeyword}" appears in title and description.` });
      } else if (inTitle) {
        checks.push({ type: 'info', text: `Focus keyword "${focusKeyword}" is in title, but not description.` });
      } else {
        checks.push({ type: 'info', text: `Consider mentioning focus keyword "${focusKeyword}" in the SEO title.` });
      }
    }

    return checks;
  }, [effectiveTitle, effectiveDescription, metaDescription, excerpt, slug, coverImage, coverImageAlt, focusKeyword]);

  const getFullImageUrl = (val) => {
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
      return val;
    }
    const clean = val.startsWith('/') ? val : `/${val}`;
    return `${apiBaseUrl}${clean}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      {/* Editorial SEO Score & Guidance Panel */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <FiCpu style={{ color: 'var(--admin-primary)', fontSize: '1.2rem' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
            Live Editorial SEO Guidance
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 'auto' }}>
            Non-blocking editorial guidelines
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
          {analysis.map((check, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                background: check.type === 'good' ? '#ECFDF5' : check.type === 'warning' ? '#FFFBEB' : '#F1F5F9',
                color: check.type === 'good' ? '#065F46' : check.type === 'warning' ? '#92400E' : '#334155',
                border: `1px solid ${check.type === 'good' ? '#A7F3D0' : check.type === 'warning' ? '#FDE68A' : '#E2E8F0'}`,
              }}
            >
              {check.type === 'good' ? (
                <FiCheckCircle style={{ color: '#10B981', flexShrink: 0 }} />
              ) : check.type === 'warning' ? (
                <FiAlertTriangle style={{ color: '#F59E0B', flexShrink: 0 }} />
              ) : (
                <FiInfo style={{ color: '#64748B', flexShrink: 0 }} />
              )}
              <span>{check.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Preview Panel (Google SERP & Social Card) */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1.5px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
              Realtime Search & Social Previews
            </span>
          </div>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setActivePreviewTab('google')}
              style={{
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: activePreviewTab === 'google' ? '#FFFFFF' : 'transparent',
                color: activePreviewTab === 'google' ? '#0F172A' : '#64748B',
                boxShadow: activePreviewTab === 'google' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <FiSearch /> Google SERP
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('social')}
              style={{
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: activePreviewTab === 'social' ? '#FFFFFF' : 'transparent',
                color: activePreviewTab === 'social' ? '#0F172A' : '#64748B',
                boxShadow: activePreviewTab === 'social' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <FiShare2 /> OpenGraph / Social Card
            </button>
          </div>
        </div>

        {/* Google SERP Snippet Preview */}
        {activePreviewTab === 'google' && (
          <div
            style={{
              padding: '1.25rem',
              background: '#FFFFFF',
              border: '1px solid #DFE1E5',
              borderRadius: '8px',
              fontFamily: 'arial, sans-serif',
              maxWidth: '600px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--admin-primary)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                Q
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', color: '#202124', lineHeight: 1.2 }}>QuoteMeTrip</span>
                <span style={{ fontSize: '12px', color: '#4D5156', lineHeight: 1.2 }}>
                  {canonicalUrl || publicUrl}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#1A0DAB',
                lineHeight: 1.3,
                fontWeight: 400,
                cursor: 'pointer',
                margin: '0.25rem 0',
                wordBreak: 'break-word',
              }}
            >
              {effectiveTitle} | QuoteMeTrip
            </div>
            <div style={{ fontSize: '14px', color: '#4D5156', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {effectiveDescription}
            </div>
          </div>
        )}

        {/* Social Card Preview */}
        {activePreviewTab === 'social' && (
          <div
            style={{
              maxWidth: '520px',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
          >
            {effectiveOgImage ? (
              <div style={{ width: '100%', height: '220px', background: '#F1F5F9' }}>
                <img
                  src={getFullImageUrl(effectiveOgImage)}
                  alt="Social preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                QuoteMeTrip Travel Guide
              </div>
            )}
            <div style={{ padding: '0.875rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                quotemetrip.com
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', margin: '0.25rem 0 0.35rem' }}>
                {effectiveOgTitle}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                {effectiveOgDescription}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEO Form Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Meta Title */}
        <div className="admin-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-form-label" htmlFor="seo-meta-title">
              SEO Meta Title
            </label>
            <span
              style={{
                fontSize: '0.72rem',
                color: metaTitle.length > 65 ? '#EF4444' : metaTitle.length >= 45 ? '#10B981' : '#64748B',
                fontWeight: 600,
              }}
            >
              {metaTitle.length} / 60 chars (Optimal: 45–65)
            </span>
          </div>
          <input
            id="seo-meta-title"
            type="text"
            className="admin-form-input"
            value={metaTitle}
            onChange={(e) => onChangeField('metaTitle', e.target.value)}
            placeholder={title || 'Leave blank to use main article title'}
          />
          <span className="admin-form-hint">
            Custom title tag displayed in Google search results and browser tab.
          </span>
        </div>

        {/* Meta Description */}
        <div className="admin-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-form-label" htmlFor="seo-meta-desc">
              SEO Meta Description
            </label>
            <span
              style={{
                fontSize: '0.72rem',
                color: metaDescription.length > 165 ? '#EF4444' : metaDescription.length >= 120 ? '#10B981' : '#64748B',
                fontWeight: 600,
              }}
            >
              {metaDescription.length} / 160 chars (Optimal: 120–160)
            </span>
          </div>
          <textarea
            id="seo-meta-desc"
            rows={3}
            className="admin-form-textarea"
            value={metaDescription}
            onChange={(e) => onChangeField('metaDescription', e.target.value)}
            placeholder={excerpt || 'Brief summary to convince searchers to click from search results...'}
          />
        </div>

        {/* Focus Keyword & Robots Directives */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="seo-focus-kw">
              <FiKey style={{ color: 'var(--admin-primary)' }} /> Focus Keyword / Search Phrase
            </label>
            <input
              id="seo-focus-kw"
              type="text"
              className="admin-form-input"
              value={focusKeyword}
              onChange={(e) => onChangeField('focusKeyword', e.target.value)}
              placeholder="e.g. best beaches in bodrum"
            />
            <span className="admin-form-hint">Used for internal editorial guidance and check.</span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="seo-robots">
              <FiGlobe style={{ color: 'var(--admin-primary)' }} /> Meta Robots Directives
            </label>
            <select
              id="seo-robots"
              className="admin-form-select"
              value={metaRobots}
              onChange={(e) => onChangeField('metaRobots', e.target.value)}
            >
              <option value="index, follow">index, follow (Standard Public Article)</option>
              <option value="noindex, follow">noindex, follow (Hide from SERP, follow links)</option>
              <option value="noindex, nofollow">noindex, nofollow (Complete Private Staging)</option>
            </select>
            <span className="admin-form-hint">Instructs search engine crawlers how to index this page.</span>
          </div>
        </div>

        {/* Canonical URL & Twitter Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="seo-canonical">
              Canonical URL Override (Optional)
            </label>
            <input
              id="seo-canonical"
              type="text"
              className="admin-form-input"
              value={canonicalUrl}
              onChange={(e) => onChangeField('canonicalUrl', e.target.value)}
              placeholder={publicUrl}
            />
            <span className="admin-form-hint">Leave blank to use the canonical default ({publicUrl}).</span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="seo-twitter">
              Twitter/X Card Type
            </label>
            <select
              id="seo-twitter"
              className="admin-form-select"
              value={twitterCard}
              onChange={(e) => onChangeField('twitterCard', e.target.value)}
            >
              <option value="summary_large_image">Summary Card with Large Image (Recommended)</option>
              <option value="summary">Standard Summary Card</option>
            </select>
          </div>
        </div>

        {/* OpenGraph Overrides */}
        <div
          style={{
            padding: '1rem',
            background: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Social Sharing Custom Overrides (Optional)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ fontSize: '0.75rem' }} htmlFor="og-title">
                Social Title (og:title)
              </label>
              <input
                id="og-title"
                type="text"
                className="admin-form-input"
                value={ogTitle}
                onChange={(e) => onChangeField('ogTitle', e.target.value)}
                placeholder="Leave blank to use SEO title"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ fontSize: '0.75rem' }} htmlFor="og-image">
                Social Image URL (og:image)
              </label>
              <input
                id="og-image"
                type="text"
                className="admin-form-input"
                value={ogImage}
                onChange={(e) => onChangeField('ogImage', e.target.value)}
                placeholder="Leave blank to use Cover Image"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label" style={{ fontSize: '0.75rem' }} htmlFor="og-desc">
              Social Description (og:description)
            </label>
            <textarea
              id="og-desc"
              rows={2}
              className="admin-form-textarea"
              value={ogDescription}
              onChange={(e) => onChangeField('ogDescription', e.target.value)}
              placeholder="Leave blank to use SEO meta description"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

