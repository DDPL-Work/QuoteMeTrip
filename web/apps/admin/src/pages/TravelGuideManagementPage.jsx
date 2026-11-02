import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiMapPin,
  FiGlobe,
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiSend,
  FiArchive,
  FiX,
  FiSliders,
  FiLayout,
} from 'react-icons/fi';
import { adminApi, apiBaseUrl } from '../services/api.js';
import { useI18n, formatDate } from '@troublefree/i18n';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { AlertBanner } from '../components/AlertBanner.jsx';
import { ImagePickerField } from '../components/ImagePickerField.jsx';
import { SeoEditorSection } from '../components/SeoEditorSection.jsx';
import ArticleRichTextEditor from '../components/ArticleRichTextEditor.jsx';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function TravelGuideManagementPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'regions' | 'destinations' | 'articles'
  const activeTab = searchParams.get('tab') || 'regions';
  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Data states
  const [regions, setRegions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [regionModal, setRegionModal] = useState(null); // null | { mode: 'create' | 'edit', initial?: obj }
  const [destinationModal, setDestinationModal] = useState(null); // null | { mode: 'create' | 'edit', initial?: obj }
  const [articleModal, setArticleModal] = useState(null); // null | { mode: 'create' | 'edit', initial?: obj }
  const [articleEditorSubTab, setArticleEditorSubTab] = useState('content'); // 'content' | 'seo'
  const [articlePreviewModal, setArticlePreviewModal] = useState(null); // article object
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'region'|'destination'|'article', item: obj }
  const [actionLoading, setActionLoading] = useState(false);

  // Load All Entities
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regs, dests, arts] = await Promise.all([
        adminApi.listTravelGuideRegions(),
        adminApi.listTravelGuideDestinations(),
        adminApi.listTravelGuideArticles(),
      ]);
      setRegions(Array.isArray(regs) ? regs : []);
      setDestinations(Array.isArray(dests) ? dests : []);
      setArticles(Array.isArray(arts) ? arts : []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to load Travel Guide content.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lookup Maps
  const regionMap = useMemo(() => {
    const map = new Map();
    regions.forEach((r) => map.set(r.id, r));
    return map;
  }, [regions]);

  const destinationMap = useMemo(() => {
    const map = new Map();
    destinations.forEach((d) => map.set(d.id, d));
    return map;
  }, [destinations]);

  // Filtered Lists
  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const matchesQuery =
        !searchQuery ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [regions, searchQuery, statusFilter]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((d) => {
      const matchesQuery =
        !searchQuery ||
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.country?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || d.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [destinations, searchQuery, statusFilter]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesQuery =
        !searchQuery ||
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.slug?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [articles, searchQuery, statusFilter]);

  // --- Handlers: Region CRUD ---
  const handleSaveRegion = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      description: String(formData.get('description') || '').trim() || null,
      image: regionModal.image || null,
      status: formData.get('status') || 'draft',
      sortOrder: Number(formData.get('sortOrder') || 0),
    };

    if (!payload.name || !payload.slug) {
      setFeedback({ type: 'error', message: 'Name and slug are required for region.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      if (regionModal.mode === 'create') {
        await adminApi.createTravelGuideRegion(payload);
        setFeedback({ type: 'success', message: `Region "${payload.name}" created successfully.` });
      } else {
        await adminApi.updateTravelGuideRegion(regionModal.initial.id, payload);
        setFeedback({ type: 'success', message: `Region "${payload.name}" updated successfully.` });
      }
      setRegionModal(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save region.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRegion = async () => {
    if (!deleteConfirm?.item) return;
    const { item } = deleteConfirm;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.deleteTravelGuideRegion(item.id);
      setFeedback({ type: 'success', message: `Region "${item.name}" deleted successfully.` });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to delete region. Ensure no destinations are linked to it.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Destination CRUD ---
  const handleSaveDestination = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const regionId = Number(formData.get('regionId'));
    const payload = {
      regionId,
      name: String(formData.get('name') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      country: String(formData.get('country') || '').trim() || null,
      shortDescription: String(formData.get('shortDescription') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      image: destinationModal.image || null,
      status: formData.get('status') || 'draft',
      sortOrder: Number(formData.get('sortOrder') || 0),
    };

    if (!payload.name || !payload.slug || !payload.regionId) {
      setFeedback({ type: 'error', message: 'Region, Name, and Slug are required for destination.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      if (destinationModal.mode === 'create') {
        await adminApi.createTravelGuideDestination(payload);
        setFeedback({ type: 'success', message: `Destination "${payload.name}" created successfully.` });
      } else {
        await adminApi.updateTravelGuideDestination(destinationModal.initial.id, payload);
        setFeedback({ type: 'success', message: `Destination "${payload.name}" updated successfully.` });
      }
      setDestinationModal(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save destination.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDestination = async () => {
    if (!deleteConfirm?.item) return;
    const { item } = deleteConfirm;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.deleteTravelGuideDestination(item.id);
      setFeedback({ type: 'success', message: `Destination "${item.name}" deleted successfully.` });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to delete destination.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Article CRUD & Publish ---
  const handleOpenArticleModal = (mode, initial = null) => {
    setArticleEditorSubTab('content');
    setArticleModal({
      mode,
      initial,
      title: initial?.title || '',
      slug: initial?.slug || '',
      isSlugCustomized: Boolean(initial?.slug),
      regionId: initial?.regionId ? String(initial.regionId) : '',
      destinationId: initial?.destinationId ? String(initial.destinationId) : '',
      excerpt: initial?.excerpt || '',
      content: initial?.content || '',
      contentJson: initial?.contentJson || null,
      coverImage: initial?.coverImage || '',
      coverImageAlt: initial?.coverImageAlt || '',
      status: initial?.status || 'draft',
      seoValues: {
        metaTitle: initial?.metaTitle || '',
        metaDescription: initial?.metaDescription || '',
        canonicalUrl: initial?.canonicalUrl || '',
        metaRobots: initial?.metaRobots || 'index, follow',
        ogTitle: initial?.ogTitle || '',
        ogDescription: initial?.ogDescription || '',
        ogImage: initial?.ogImage || '',
        twitterCard: initial?.twitterCard || 'summary_large_image',
        focusKeyword: initial?.focusKeyword || '',
        relatedKeywords: initial?.relatedKeywords || '',
      },
    });
  };

  const handleArticleFieldChange = (field, val) => {
    setArticleModal((prev) => {
      if (!prev) return null;
      const next = { ...prev, [field]: val };
      if (field === 'title' && !prev.isSlugCustomized) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleArticleSeoFieldChange = (field, val) => {
    setArticleModal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        seoValues: {
          ...prev.seoValues,
          [field]: val,
        },
      };
    });
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!articleModal) return;

    const payload = {
      title: articleModal.title.trim(),
      slug: articleModal.slug.trim(),
      regionId: articleModal.regionId ? Number(articleModal.regionId) : null,
      destinationId: articleModal.destinationId ? Number(articleModal.destinationId) : null,
      excerpt: articleModal.excerpt.trim() || null,
      content: articleModal.content
        ? articleModal.content.trim().replace(/https?:\/\/[^/]+(?::\d+)?(\/uploads\/)/g, '$1')
        : null,
      contentJson: articleModal.contentJson || null,
      coverImage: articleModal.coverImage.trim() || null,
      coverImageAlt: articleModal.coverImageAlt.trim() || null,
      status: articleModal.status || 'draft',
      metaTitle: articleModal.seoValues.metaTitle.trim() || null,
      metaDescription: articleModal.seoValues.metaDescription.trim() || null,
      canonicalUrl: articleModal.seoValues.canonicalUrl.trim() || null,
      metaRobots: articleModal.seoValues.metaRobots || 'index, follow',
      ogTitle: articleModal.seoValues.ogTitle.trim() || null,
      ogDescription: articleModal.seoValues.ogDescription.trim() || null,
      ogImage: articleModal.seoValues.ogImage.trim() || null,
      twitterCard: articleModal.seoValues.twitterCard || 'summary_large_image',
      focusKeyword: articleModal.seoValues.focusKeyword.trim() || null,
      relatedKeywords: articleModal.seoValues.relatedKeywords.trim() || null,
    };

    if (!payload.title || !payload.slug) {
      setFeedback({ type: 'error', message: 'Title and Slug are required for article.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      if (articleModal.mode === 'create') {
        await adminApi.createTravelGuideArticle(payload);
        setFeedback({ type: 'success', message: `Article "${payload.title}" created successfully.` });
      } else {
        await adminApi.updateTravelGuideArticle(articleModal.initial.id, payload);
        setFeedback({ type: 'success', message: `Article "${payload.title}" updated successfully.` });
      }
      setArticleModal(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save article. Check slug uniqueness.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishArticle = async (articleId, shouldPublish) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      if (shouldPublish) {
        await adminApi.publishTravelGuideArticle(articleId);
        setFeedback({ type: 'success', message: 'Article published successfully and live on QuoteMeTrip.' });
      } else {
        await adminApi.unpublishTravelGuideArticle(articleId);
        setFeedback({ type: 'success', message: 'Article unpublished and returned to draft.' });
      }
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update article publication status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!deleteConfirm?.item) return;
    const { item } = deleteConfirm;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.deleteTravelGuideArticle(item.id);
      setFeedback({ type: 'success', message: `Article "${item.title}" deleted successfully.` });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete article.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="admin-eyebrow">
            <FiGlobe /> Editorial & Publishing
          </div>
          <h1 style={{ fontSize: '1.85rem', color: '#0F172A', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {t('admin.travelGuide.title', 'Travel Guide Management')}
          </h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {t('admin.travelGuide.subtitle', 'Publish, optimize, and organize high-ranking regional guides and travel articles on QuoteMeTrip.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={loadData}
            disabled={loading || actionLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiRefreshCw className={loading ? 'admin-spin' : ''} /> {t('admin.common.refresh', 'Refresh')}
          </button>
          {activeTab === 'regions' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => setRegionModal({ mode: 'create', initial: {}, image: '' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiPlus /> {t('admin.travelGuide.newRegion', 'Add Region')}
            </button>
          )}
          {activeTab === 'destinations' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => setDestinationModal({ mode: 'create', initial: {}, image: '' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiPlus /> {t('admin.travelGuide.newDestination', 'Add Destination')}
            </button>
          )}
          {activeTab === 'articles' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => handleOpenArticleModal('create', null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiPlus /> {t('admin.travelGuide.newArticle', 'Create Article')}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #E2E8F0',
          gap: '2rem',
          marginTop: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('regions')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'regions' ? '2.5px solid var(--admin-primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            padding: '0.85rem 0.25rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'regions' ? 800 : 600,
            color: activeTab === 'regions' ? 'var(--admin-primary)' : '#64748B',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FiGlobe /> {t('admin.travelGuide.tabRegions', 'Regions')} ({regions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('destinations')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'destinations' ? '2.5px solid var(--admin-primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            padding: '0.85rem 0.25rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'destinations' ? 800 : 600,
            color: activeTab === 'destinations' ? 'var(--admin-primary)' : '#64748B',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FiMapPin /> {t('admin.travelGuide.tabDestinations', 'Destinations')} ({destinations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'articles' ? '2.5px solid var(--admin-primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            padding: '0.85rem 0.25rem',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'articles' ? 800 : 600,
            color: activeTab === 'articles' ? 'var(--admin-primary)' : '#64748B',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FiFileText /> {t('admin.travelGuide.tabArticles', 'Articles & SEO')} ({articles.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0AEC0',
            }}
          />
          <input
            type="text"
            placeholder={
              activeTab === 'regions'
                ? t('admin.travelGuide.searchRegions', 'Search regions by name or slug...')
                : activeTab === 'destinations'
                ? t('admin.travelGuide.searchDestinations', 'Search destinations by name, slug, country...')
                : t('admin.travelGuide.searchArticles', 'Search articles by title or slug...')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFilter style={{ color: '#718096' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">{t('admin.common.allStatuses', 'All Statuses')}</option>
            <option value="published">{t('admin.common.published', 'Published')}</option>
            <option value="draft">{t('admin.common.draft', 'Draft')}</option>
            <option value="archived">{t('admin.common.archived', 'Archived')}</option>
          </select>
        </div>
      </div>

      {/* TAB 1: REGIONS */}
      {activeTab === 'regions' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
              <FiRefreshCw className="admin-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} />
              <div>{t('admin.common.loading', 'Loading data...')}</div>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <FiGlobe style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
                {t('admin.travelGuide.noRegionsFound', 'No regions found')}
              </div>
              <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.875rem' }}>
                {searchQuery || statusFilter
                  ? t('admin.common.tryAdjustingFilters', 'Try adjusting your search or status filter.')
                  : t('admin.travelGuide.createFirstRegion', 'Get started by creating your first geographical region.')}
              </p>
              {!searchQuery && !statusFilter && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => setRegionModal({ mode: 'create', initial: {}, image: '' })}
                >
                  <FiPlus /> {t('admin.travelGuide.newRegion', 'Add Region')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.regionName', 'Region Name')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Slug</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.sortOrder', 'Order')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.status', 'Status')}</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>{t('admin.common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegions.map((region) => (
                    <tr key={region.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#64748B' }}>#{region.id}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{region.name}</div>
                        {region.description && (
                          <div style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {region.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <code style={{ background: '#F1F5F9', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#334155' }}>
                          /{region.slug}
                        </code>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748B' }}>{region.sortOrder ?? 0}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          className={`admin-badge admin-badge-${
                            region.status === 'published' ? 'success' : region.status === 'archived' ? 'danger' : 'warning'
                          }`}
                        >
                          {region.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            title={t('admin.common.edit', 'Edit')}
                            onClick={() => setRegionModal({ mode: 'edit', initial: region, image: region.image || '' })}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title={t('admin.common.delete', 'Delete')}
                            onClick={() => setDeleteConfirm({ type: 'region', item: region })}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DESTINATIONS */}
      {activeTab === 'destinations' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
              <FiRefreshCw className="admin-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} />
              <div>{t('admin.common.loading', 'Loading data...')}</div>
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <FiMapPin style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
                {t('admin.travelGuide.noDestinationsFound', 'No destinations found')}
              </div>
              <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.875rem' }}>
                {searchQuery || statusFilter
                  ? t('admin.common.tryAdjustingFilters', 'Try adjusting your search or status filter.')
                  : t('admin.travelGuide.createFirstDestination', 'Add your first travel destination attached to a region.')}
              </p>
              {!searchQuery && !statusFilter && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => setDestinationModal({ mode: 'create', initial: {}, image: '' })}
                >
                  <FiPlus /> {t('admin.travelGuide.newDestination', 'Add Destination')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.destinationName', 'Destination')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.region', 'Region')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.country', 'Country')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.status', 'Status')}</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>{t('admin.common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDestinations.map((dest) => {
                    const parentRegion = regionMap.get(dest.regionId);
                    return (
                      <tr key={dest.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#64748B' }}>#{dest.id}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{dest.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>/{dest.slug}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {parentRegion ? (
                            <span style={{ fontWeight: 600, color: '#334155' }}>{parentRegion.name}</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>#{dest.regionId}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>{dest.country || '—'}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            className={`admin-badge admin-badge-${
                              dest.status === 'published' ? 'success' : dest.status === 'archived' ? 'danger' : 'warning'
                            }`}
                          >
                            {dest.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              title={t('admin.common.edit', 'Edit')}
                              onClick={() => setDestinationModal({ mode: 'edit', initial: dest, image: dest.image || '' })}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title={t('admin.common.delete', 'Delete')}
                              onClick={() => setDeleteConfirm({ type: 'destination', item: dest })}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ARTICLES */}
      {activeTab === 'articles' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
              <FiRefreshCw className="admin-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} />
              <div>{t('admin.common.loading', 'Loading data...')}</div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <FiFileText style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
                {t('admin.travelGuide.noArticlesFound', 'No articles found')}
              </div>
              <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.875rem' }}>
                {searchQuery || statusFilter
                  ? t('admin.common.tryAdjustingFilters', 'Try adjusting your search or status filter.')
                  : t('admin.travelGuide.createFirstArticle', 'Write your first travel guide article or editorial post.')}
              </p>
              {!searchQuery && !statusFilter && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => handleOpenArticleModal('create', null)}
                >
                  <FiPlus /> {t('admin.travelGuide.newArticle', 'Create Article')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.875rem 1rem' }}>{t('admin.travelGuide.articleTitle', 'Article Title')}</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Target</th>
                    <th style={{ padding: '0.875rem 1rem' }}>SEO Title / Keyword</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((art) => {
                    const dest = art.destinationId ? destinationMap.get(art.destinationId) : null;
                    const reg = art.regionId ? regionMap.get(art.regionId) : null;
                    const isPublished = art.status === 'published';

                    return (
                      <tr key={art.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#64748B' }}>#{art.id}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{art.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>/travel-guides/{art.slug}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {dest ? (
                            <span style={{ color: '#0369A1', fontWeight: 600 }}>📍 {dest.name}</span>
                          ) : reg ? (
                            <span style={{ color: '#047857', fontWeight: 600 }}>🌍 {reg.name}</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>{t('admin.common.general', 'General')}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontSize: '0.8rem', color: art.metaTitle ? '#1E293B' : '#94A3B8' }}>
                            {art.metaTitle || 'Default title'}
                          </div>
                          {art.focusKeyword && (
                            <span className="admin-badge admin-badge-info" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                              KW: {art.focusKeyword}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            className={`admin-badge admin-badge-${
                              isPublished ? 'success' : art.status === 'archived' ? 'danger' : 'warning'
                            }`}
                          >
                            {art.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              title="Preview Article & SEO"
                              onClick={() => setArticlePreviewModal(art)}
                            >
                              <FiEye />
                            </button>
                            {isPublished ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                title="Unpublish"
                                onClick={() => handlePublishArticle(art.id, false)}
                                disabled={actionLoading}
                              >
                                <FiArchive />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-btn admin-btn-primary admin-btn-sm"
                                title="Publish"
                                onClick={() => handlePublishArticle(art.id, true)}
                                disabled={actionLoading}
                              >
                                <FiSend />
                              </button>
                            )}
                            <button
                              type="button"
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              title="Edit Article & SEO"
                              onClick={() => handleOpenArticleModal('edit', art)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Delete"
                              onClick={() => setDeleteConfirm({ type: 'article', item: art })}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: REGION (CREATE / EDIT) --- */}
      {regionModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '580px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiGlobe style={{ color: 'var(--admin-primary)' }} />
                {regionModal.mode === 'create'
                  ? t('admin.travelGuide.createRegionTitle', 'Create Travel Region')
                  : t('admin.travelGuide.editRegionTitle', 'Edit Travel Region')}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setRegionModal(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSaveRegion}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="reg-name">
                    {t('admin.travelGuide.name', 'Region Name')} <span className="required-star">*</span>
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    className="admin-form-input"
                    defaultValue={regionModal.initial?.name || ''}
                    placeholder="e.g. Aegean Coast"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="reg-slug">
                    Slug <span className="required-star">*</span>
                  </label>
                  <input
                    id="reg-slug"
                    name="slug"
                    type="text"
                    required
                    className="admin-form-input"
                    defaultValue={regionModal.initial?.slug || ''}
                    placeholder="e.g. aegean-coast"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="reg-desc">
                    {t('admin.travelGuide.description', 'Description')}
                  </label>
                  <textarea
                    id="reg-desc"
                    name="description"
                    rows={3}
                    className="admin-form-textarea"
                    defaultValue={regionModal.initial?.description || ''}
                    placeholder="Brief description of the region..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="reg-status">
                      {t('admin.travelGuide.status', 'Status')}
                    </label>
                    <select
                      id="reg-status"
                      name="status"
                      className="admin-form-select"
                      defaultValue={regionModal.initial?.status || 'draft'}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="reg-sort">
                      {t('admin.travelGuide.sortOrder', 'Sort Order')}
                    </label>
                    <input
                      id="reg-sort"
                      name="sortOrder"
                      type="number"
                      min={0}
                      className="admin-form-input"
                      defaultValue={regionModal.initial?.sortOrder ?? 0}
                    />
                  </div>
                </div>

                {/* Image Picker with local upload + URL */}
                <ImagePickerField
                  label="Region Cover Image"
                  value={regionModal.image || ''}
                  onChangeUrl={(newUrl) => setRegionModal((prev) => ({ ...prev, image: newUrl }))}
                />
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setRegionModal(null)}
                  disabled={actionLoading}
                >
                  {t('admin.common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('admin.common.saving', 'Saving...') : t('admin.common.save', 'Save Region')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DESTINATION (CREATE / EDIT) --- */}
      {destinationModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '620px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <FiMapPin style={{ color: 'var(--admin-primary)' }} />
                {destinationModal.mode === 'create'
                  ? t('admin.travelGuide.createDestTitle', 'Create Travel Destination')
                  : t('admin.travelGuide.editDestTitle', 'Edit Travel Destination')}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setDestinationModal(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSaveDestination}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="dest-region">
                    {t('admin.travelGuide.parentRegion', 'Parent Region')} <span className="required-star">*</span>
                  </label>
                  <select
                    id="dest-region"
                    name="regionId"
                    required
                    className="admin-form-select"
                    defaultValue={destinationModal.initial?.regionId || (regions[0]?.id ?? '')}
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="dest-name">
                      {t('admin.travelGuide.name', 'Destination Name')} <span className="required-star">*</span>
                    </label>
                    <input
                      id="dest-name"
                      name="name"
                      type="text"
                      required
                      className="admin-form-input"
                      defaultValue={destinationModal.initial?.name || ''}
                      placeholder="e.g. Cappadocia"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="dest-country">
                      {t('admin.travelGuide.country', 'Country')}
                    </label>
                    <input
                      id="dest-country"
                      name="country"
                      type="text"
                      className="admin-form-input"
                      defaultValue={destinationModal.initial?.country || 'Turkey'}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="dest-slug">
                    Slug <span className="required-star">*</span>
                  </label>
                  <input
                    id="dest-slug"
                    name="slug"
                    type="text"
                    required
                    className="admin-form-input"
                    defaultValue={destinationModal.initial?.slug || ''}
                    placeholder="e.g. cappadocia"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="dest-short">
                    {t('admin.travelGuide.shortDescription', 'Short Summary')}
                  </label>
                  <input
                    id="dest-short"
                    name="shortDescription"
                    type="text"
                    className="admin-form-input"
                    defaultValue={destinationModal.initial?.shortDescription || ''}
                    placeholder="One-line summary for cards"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="dest-desc">
                    {t('admin.travelGuide.description', 'Detailed Description')}
                  </label>
                  <textarea
                    id="dest-desc"
                    name="description"
                    rows={3}
                    className="admin-form-textarea"
                    defaultValue={destinationModal.initial?.description || ''}
                    placeholder="Detailed guide overview..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="dest-status">
                      {t('admin.travelGuide.status', 'Status')}
                    </label>
                    <select
                      id="dest-status"
                      name="status"
                      className="admin-form-select"
                      defaultValue={destinationModal.initial?.status || 'draft'}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="dest-sort">
                      {t('admin.travelGuide.sortOrder', 'Sort Order')}
                    </label>
                    <input
                      id="dest-sort"
                      name="sortOrder"
                      type="number"
                      min={0}
                      className="admin-form-input"
                      defaultValue={destinationModal.initial?.sortOrder ?? 0}
                    />
                  </div>
                </div>

                {/* Image Picker */}
                <ImagePickerField
                  label="Destination Cover Image"
                  value={destinationModal.image || ''}
                  onChangeUrl={(newUrl) => setDestinationModal((prev) => ({ ...prev, image: newUrl }))}
                />
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setDestinationModal(null)}
                  disabled={actionLoading}
                >
                  {t('admin.common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('admin.common.saving', 'Saving...') : t('admin.common.save', 'Save Destination')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MASTER MODAL: ARTICLE & SEO EDITOR --- */}
      {articleModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: 'min(1480px, 96vw)', width: '96%' }}>
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">
                  <FiFileText style={{ color: 'var(--admin-primary)' }} />
                  {articleModal.mode === 'create' ? 'Create Travel Guide Article' : 'Edit Travel Guide Article'}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  Comprehensive content publishing and Google SEO optimization workflow.
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setArticleModal(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {/* Sub-Tabs: Content vs SEO Settings */}
            <div
              style={{
                display: 'flex',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '0 1.5rem',
                gap: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setArticleEditorSubTab('content')}
                style={{
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: articleEditorSubTab === 'content' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                  fontWeight: articleEditorSubTab === 'content' ? 700 : 500,
                  color: articleEditorSubTab === 'content' ? 'var(--admin-primary)' : '#64748B',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiLayout /> Core Content & Details
              </button>
              <button
                type="button"
                onClick={() => setArticleEditorSubTab('seo')}
                style={{
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: articleEditorSubTab === 'seo' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                  fontWeight: articleEditorSubTab === 'seo' ? 700 : 500,
                  color: articleEditorSubTab === 'seo' ? 'var(--admin-primary)' : '#64748B',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiSliders /> SEO Settings & Previews
              </button>
            </div>

            <form onSubmit={handleSaveArticle} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="admin-modal-body" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
                {articleEditorSubTab === 'content' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="art-title">
                        Article Title <span className="required-star">*</span>
                      </label>
                      <input
                        id="art-title"
                        type="text"
                        required
                        className="admin-form-input"
                        value={articleModal.title}
                        onChange={(e) => handleArticleFieldChange('title', e.target.value)}
                        placeholder="e.g. 10 Secret Coves Along the Lycian Way"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="art-slug">
                        URL Slug <span className="required-star">*</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>/travel-guides/</span>
                        <input
                          id="art-slug"
                          type="text"
                          required
                          className="admin-form-input"
                          value={articleModal.slug}
                          onChange={(e) => {
                            setArticleModal((prev) => ({
                              ...prev,
                              slug: slugify(e.target.value),
                              isSlugCustomized: true,
                            }));
                          }}
                          placeholder="e.g. 10-secret-coves-lycian-way"
                        />
                      </div>
                      <span className="admin-form-hint">
                        Automatically generated from title. Edit manually to customize permalink.
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label" htmlFor="art-region">
                          Link to Region (Optional)
                        </label>
                        <select
                          id="art-region"
                          className="admin-form-select"
                          value={articleModal.regionId}
                          onChange={(e) => handleArticleFieldChange('regionId', e.target.value)}
                        >
                          <option value="">{t('admin.common.none', 'None / General')}</option>
                          {regions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label" htmlFor="art-dest">
                          Link to Destination (Optional)
                        </label>
                        <select
                          id="art-dest"
                          className="admin-form-select"
                          value={articleModal.destinationId}
                          onChange={(e) => handleArticleFieldChange('destinationId', e.target.value)}
                        >
                          <option value="">{t('admin.common.none', 'None / General')}</option>
                          {destinations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Featured Image Picker */}
                    <ImagePickerField
                      label="Featured Cover Image"
                      value={articleModal.coverImage}
                      altValue={articleModal.coverImageAlt}
                      onChangeUrl={(url) => handleArticleFieldChange('coverImage', url)}
                      onChangeAlt={(alt) => handleArticleFieldChange('coverImageAlt', alt)}
                    />

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="art-excerpt">
                        Excerpt / Lead Paragraph
                      </label>
                      <textarea
                        id="art-excerpt"
                        rows={2}
                        className="admin-form-textarea"
                        value={articleModal.excerpt}
                        onChange={(e) => handleArticleFieldChange('excerpt', e.target.value)}
                        placeholder="A catchy summary for article cards and SEO previews..."
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="art-content">
                        Article Body Content
                      </label>
                      <ArticleRichTextEditor
                        value={articleModal.content}
                        jsonValue={articleModal.contentJson}
                        onChange={(html, json) => {
                          setArticleModal((prev) => ({
                            ...prev,
                            content: html,
                            contentJson: json,
                          }));
                        }}
                      />
                    </div>

                    <div className="admin-form-group" style={{ maxWidth: '240px' }}>
                      <label className="admin-form-label" htmlFor="art-status">
                        Publication Status
                      </label>
                      <select
                        id="art-status"
                        className="admin-form-select"
                        value={articleModal.status}
                        onChange={(e) => handleArticleFieldChange('status', e.target.value)}
                      >
                        <option value="draft">Draft (Unpublished)</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <SeoEditorSection
                    title={articleModal.title}
                    slug={articleModal.slug}
                    excerpt={articleModal.excerpt}
                    content={articleModal.content}
                    coverImage={articleModal.coverImage}
                    coverImageAlt={articleModal.coverImageAlt}
                    seoValues={articleModal.seoValues}
                    onChangeField={handleArticleSeoFieldChange}
                  />
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setArticleModal(null)}
                  disabled={actionLoading}
                >
                  {t('admin.common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('admin.common.saving', 'Saving...') : 'Save Article & SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL: ARTICLE --- */}
      {articlePreviewModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title" style={{ fontSize: '1.25rem' }}>
                {articlePreviewModal.title}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setArticlePreviewModal(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {articlePreviewModal.coverImage && (
                <div style={{ marginBottom: '1rem', borderRadius: '10px', overflow: 'hidden' }}>
                  <img
                    src={
                      articlePreviewModal.coverImage.startsWith('http')
                        ? articlePreviewModal.coverImage
                        : `${apiBaseUrl}${articlePreviewModal.coverImage.startsWith('/') ? '' : '/'}${articlePreviewModal.coverImage}`
                    }
                    alt={articlePreviewModal.coverImageAlt || articlePreviewModal.title}
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#64748B', flexWrap: 'wrap' }}>
                <span className="admin-badge admin-badge-info">Slug: /travel-guides/{articlePreviewModal.slug}</span>
                <span className={`admin-badge admin-badge-${articlePreviewModal.status === 'published' ? 'success' : 'warning'}`}>
                  {articlePreviewModal.status}
                </span>
                {articlePreviewModal.publishedAt && <span>{formatDate(articlePreviewModal.publishedAt)}</span>}
                {articlePreviewModal.metaTitle && (
                  <span className="admin-badge admin-badge-primary">SEO Title Custom</span>
                )}
              </div>
              {articlePreviewModal.excerpt && (
                <div
                  style={{
                    fontStyle: 'italic',
                    color: '#475569',
                    borderLeft: '3px solid #CBD5E1',
                    paddingLeft: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {articlePreviewModal.excerpt}
                </div>
              )}
              {articlePreviewModal.content && /<[a-z][\s\S]*>/i.test(articlePreviewModal.content) ? (
                <div
                  className="article-preview-rendered"
                  style={{ lineHeight: 1.7, color: '#1E293B', fontSize: '0.95rem' }}
                  dangerouslySetInnerHTML={{ __html: articlePreviewModal.content }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#1E293B', fontSize: '0.95rem' }}>
                  {articlePreviewModal.content || t('admin.travelGuide.noContent', 'No article body content written.')}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setArticlePreviewModal(null)}
              >
                {t('admin.common.close', 'Close Preview')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title={
            deleteConfirm.type === 'region'
              ? t('admin.travelGuide.deleteRegion', 'Delete Travel Region')
              : deleteConfirm.type === 'destination'
              ? t('admin.travelGuide.deleteDestination', 'Delete Travel Destination')
              : t('admin.travelGuide.deleteArticle', 'Delete Guide Article')
          }
          message={
            deleteConfirm.type === 'region'
              ? `Are you sure you want to permanently delete region "${deleteConfirm.item.name}"? This action cannot be undone.`
              : deleteConfirm.type === 'destination'
              ? `Are you sure you want to permanently delete destination "${deleteConfirm.item.name}"? This action cannot be undone.`
              : `Are you sure you want to permanently delete article "${deleteConfirm.item.title}"? This action cannot be undone.`
          }
          confirmText={t('admin.common.delete', 'Delete')}
          cancelText={t('admin.common.cancel', 'Cancel')}
          variant="danger"
          loading={actionLoading}
          onConfirm={
            deleteConfirm.type === 'region'
              ? handleDeleteRegion
              : deleteConfirm.type === 'destination'
              ? handleDeleteDestination
              : handleDeleteArticle
          }
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
