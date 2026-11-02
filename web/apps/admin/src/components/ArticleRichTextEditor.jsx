import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiImage,
  FiRotateCcw,
  FiRotateCw,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiMaximize2,
  FiMinus,
  FiUpload,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { adminApi, apiClient, apiBaseUrl } from '../services/api.js';

const getFullImageUrl = (val) => {
  if (!val) return '';
  if (
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('data:') ||
    val.startsWith('blob:')
  ) {
    return val;
  }
  const clean = val.startsWith('/') ? val : `/${val}`;
  if (apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/+$/, '')}${clean}`;
  }
  return clean;
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('alt') || '',
        renderHTML: (attributes) => ({
          alt: attributes.alt || '',
        }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || element.getAttribute('title') || '',
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return {
            'data-caption': attributes.caption,
            title: attributes.caption,
          };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          const align = attributes.align || 'center';
          return {
            'data-align': align,
            class: `article-img-insert align-${align}`,
          };
        },
      },
    };
  },
});

export default function ArticleRichTextEditor({
  value = '',
  jsonValue = null,
  onChange,
  placeholder: _placeholder = 'Write the full travel guide article body here...',
}) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlign, setImageAlign] = useState('center'); // 'left' | 'center' | 'right' | 'full'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'article-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: jsonValue || value || '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      if (onChange) {
        onChange(html, json);
      }
    },
  });

  // Sync external value changes if needed (e.g. switching articles)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value && value !== currentHtml && !editor.isFocused) {
      editor.commands.setContent(jsonValue || value, false);
    }
  }, [value, jsonValue, editor]);

  const handleOpenLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkModalOpen(true);
  };

  const handleSetLink = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editor) return;
    if (linkUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let formattedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('/') && !formattedUrl.startsWith('#')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    }
    setLinkModalOpen(false);
  };

  const handleOpenImageModal = () => {
    setImageUrl('');
    setLocalPreview('');
    setImageAlt('');
    setImageCaption('');
    setImageAlign('center');
    setUploadError('');
    setImageModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      setLocalPreview(base64Data);

      const payload = {
        data: base64Data,
        file: base64Data,
        name: file.name,
        originalName: file.name,
        mimeType: file.type,
      };

      let res;
      if (typeof adminApi?.uploadTravelGuideImage === 'function') {
        res = await adminApi.uploadTravelGuideImage(payload);
      } else if (typeof adminApi?.uploadTravelGuideMedia === 'function') {
        res = await adminApi.uploadTravelGuideMedia(payload);
      } else if (apiClient?.post) {
        const resp = await apiClient.post('/api/v1/admin/travel-guide/upload', payload);
        res = resp?.data?.data || resp?.data;
      } else {
        throw new Error('Image upload service is not available.');
      }

      const uploadedUrl = res?.url || res?.data?.url;
      if (!uploadedUrl) throw new Error('No URL returned from server.');

      setImageUrl(uploadedUrl);
      if (!imageAlt) {
        // Derive initial alt from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setImageAlt(cleanName);
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertImage = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editor || !imageUrl.trim()) return;

    const finalUrl = getFullImageUrl(imageUrl.trim());
    editor
      .chain()
      .focus()
      .setImage({
        src: finalUrl,
        alt: imageAlt.trim(),
        caption: imageCaption.trim(),
        align: imageAlign,
      })
      .run();

    setImageModalOpen(false);
  };

  if (!editor) {
    return <div style={{ padding: '1rem', color: '#64748B' }}>Loading editor...</div>;
  }

  const btnStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 6px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: isActive ? 'var(--admin-primary, #0D9488)' : '#E2E8F0',
    backgroundColor: isActive ? 'rgba(13, 148, 136, 0.1)' : '#FFFFFF',
    color: isActive ? 'var(--admin-primary, #0D9488)' : '#334155',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  });

  return (
    <div
      className="article-rich-editor-wrapper"
      style={{
        border: '1.5px solid #CBD5E1',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Editor Toolbar */}
      <div
        className="article-rich-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 10px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          userSelect: 'none',
        }}
      >
        {/* Headings */}
        <button
          type="button"
          title="Paragraph / Normal Text"
          style={btnStyle(editor.isActive('paragraph'))}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </button>
        <button
          type="button"
          title="Heading 2 (Section Title)"
          style={btnStyle(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          title="Heading 3 (Sub-section)"
          style={btnStyle(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          title="Heading 4 (Minor Subtitle)"
          style={btnStyle(editor.isActive('heading', { level: 4 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H4
        </button>

        <span style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />

        {/* Basic formatting */}
        <button
          type="button"
          title="Bold (Ctrl+B)"
          style={btnStyle(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FiBold size={15} />
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          style={btnStyle(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FiItalic size={15} />
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          style={btnStyle(editor.isActive('underline'))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FiUnderline size={15} />
        </button>

        <span style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />

        {/* Lists & Quotes */}
        <button
          type="button"
          title="Bullet List"
          style={btnStyle(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FiList size={15} />
        </button>
        <button
          type="button"
          title="Numbered List"
          style={btnStyle(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </button>
        <button
          type="button"
          title="Blockquote"
          style={btnStyle(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;
        </button>
        <button
          type="button"
          title="Horizontal Divider"
          style={btnStyle(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <FiMinus size={15} />
        </button>

        <span style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />

        {/* Link & Media */}
        <button
          type="button"
          title="Add or Edit Link"
          style={btnStyle(editor.isActive('link'))}
          onClick={handleOpenLinkModal}
        >
          <FiLink size={15} />
        </button>
        <button
          type="button"
          title="Insert Image (Upload or URL with Alt, Caption & Alignment)"
          style={{
            ...btnStyle(false),
            backgroundColor: '#0D9488',
            color: '#FFFFFF',
            borderColor: '#0D9488',
            fontWeight: 600,
            gap: '4px',
            padding: '0 8px',
          }}
          onClick={handleOpenImageModal}
        >
          <FiImage size={15} /> <span>Insert Image</span>
        </button>

        <span style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />

        {/* Undo / Redo */}
        <button
          type="button"
          title="Undo"
          disabled={!editor.can().undo()}
          style={{ ...btnStyle(false), opacity: editor.can().undo() ? 1 : 0.4 }}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <FiRotateCcw size={14} />
        </button>
        <button
          type="button"
          title="Redo"
          disabled={!editor.can().redo()}
          style={{ ...btnStyle(false), opacity: editor.can().redo() ? 1 : 0.4 }}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <FiRotateCw size={14} />
        </button>
      </div>

      {/* Editor Content Box */}
      <div
        className="article-rich-content-container"
        style={{
          minHeight: '340px',
          maxHeight: '560px',
          overflowY: 'auto',
          padding: '1rem 1.25rem',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          color: '#1E293B',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Editor Footer / Character & Word Info */}
      <div
        style={{
          padding: '4px 12px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748B',
        }}
      >
        <div>
          SEO Tip: Use H2 for primary headings, H3 for sub-sections. Keep alt text descriptive.
        </div>
        <div>
          {editor.storage?.characterCount
            ? `${editor.storage.characterCount.words()} words`
            : `${editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words`}
        </div>
      </div>

      {/* --- MODAL: INSERT / EDIT LINK --- */}
      {linkModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Insert or Edit Link
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={18} />
              </button>
            </div>
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Destination URL
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="https://example.com or /travel-guides/cappadocia"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSetLink(e);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {editor.isActive('link') && (
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkModalOpen(false);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #FECACA',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Remove Link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetLink}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: INSERT IMAGE (ALT, CAPTION, ALIGNMENT) --- */}
      {imageModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '90%',
              maxWidth: '580px',
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#CCFBF1',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiImage size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                    Insert Article Image
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Include SEO alt text and responsive presentation controls.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Source Tab: Local Upload vs URL */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: imageTab === 'upload' ? '#0D9488' : '#F1F5F9',
                  color: imageTab === 'upload' ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiUpload size={14} /> Upload Local Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageTab('url');
                  setLocalPreview('');
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: imageTab === 'url' ? '#0D9488' : '#F1F5F9',
                  color: imageTab === 'url' ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiLink size={14} /> External Image URL
              </button>
            </div>

            {uploadError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}
              >
                {uploadError}
              </div>
            )}

            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                  e.preventDefault();
                  if (imageUrl && !isUploading) {
                    handleInsertImage(e);
                  }
                }
              }}
            >
              {imageTab === 'upload' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Choose Image File (JPG, PNG, WebP up to 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {isUploading && (
                    <div style={{ fontSize: '0.8rem', color: '#0D9488', marginTop: '0.35rem', fontWeight: 600 }}>
                      Uploading image to server...
                    </div>
                  )}
                  {Boolean(imageUrl || localPreview) && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <img
                        src={localPreview || getFullImageUrl(imageUrl)}
                        alt="Preview"
                        onError={(e) => {
                          if (localPreview && e.currentTarget.src !== localPreview) {
                            e.currentTarget.src = localPreview;
                          } else if (imageUrl && !e.currentTarget.dataset.retried) {
                            e.currentTarget.dataset.retried = 'true';
                            e.currentTarget.src = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                          }
                        }}
                        style={{
                          width: '84px',
                          height: '56px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#E2E8F0',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FiCheck size={14} /> Image ready to insert
                        </span>
                        {imageUrl && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748B',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '380px',
                            }}
                            title={imageUrl}
                          >
                            {imageUrl}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Image URL <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or /uploads/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Alt Text (Crucial for SEO) */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  SEO Alt Text (Recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traditional wooden gulet sailing past Butterfly Valley in Oludeniz"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                  Helps search engines understand image content and powers screen readers.
                </span>
              </div>

              {/* Caption */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Visible Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunrise over Goreme national park viewed from a hot air balloon"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Alignment Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Layout & Alignment
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'center', label: 'Center', icon: <FiAlignCenter size={14} /> },
                    { id: 'left', label: 'Left', icon: <FiAlignLeft size={14} /> },
                    { id: 'right', label: 'Right', icon: <FiAlignRight size={14} /> },
                    { id: 'full', label: 'Full Width', icon: <FiMaximize2 size={14} /> },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setImageAlign(opt.id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: imageAlign === opt.id ? '#0D9488' : '#CBD5E1',
                        backgroundColor: imageAlign === opt.id ? '#F0FDFA' : '#FFFFFF',
                        color: imageAlign === opt.id ? '#0D9488' : '#334155',
                        fontWeight: imageAlign === opt.id ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!imageUrl || isUploading}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: !imageUrl || isUploading ? 'not-allowed' : 'pointer',
                    opacity: !imageUrl || isUploading ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FiCheck size={16} /> Insert Into Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS styles for Tiptap editor content */}
      <style>{`
        .article-rich-content-container .tiptap {
          outline: none;
          min-height: 240px;
        }
        .article-rich-content-container .tiptap p {
          margin: 0.65rem 0;
        }
        .article-rich-content-container .tiptap h2 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0F172A;
          margin: 1.5rem 0 0.6rem 0;
          letter-spacing: -0.02em;
        }
        .article-rich-content-container .tiptap h3 {
          font-size: 1.22rem;
          font-weight: 700;
          color: #1E293B;
          margin: 1.25rem 0 0.5rem 0;
        }
        .article-rich-content-container .tiptap h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #334155;
          margin: 1rem 0 0.4rem 0;
        }
        .article-rich-content-container .tiptap ul,
        .article-rich-content-container .tiptap ol {
          padding-left: 1.5rem;
          margin: 0.65rem 0;
        }
        .article-rich-content-container .tiptap li {
          margin-bottom: 0.25rem;
        }
        .article-rich-content-container .tiptap blockquote {
          border-left: 4px solid #0D9488;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #475569;
          background: #F8FAFC;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 8px 8px 0;
        }
        .article-rich-content-container .tiptap hr {
          border: none;
          border-top: 2px solid #E2E8F0;
          margin: 1.5rem 0;
        }
        .article-rich-content-container .tiptap a.article-link {
          color: #0D9488;
          text-decoration: underline;
          font-weight: 600;
        }
        .article-rich-content-container .tiptap img.article-img-insert {
          border-radius: 8px;
          height: auto;
          display: block;
          max-width: 100%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          margin: 1.25rem 0;
        }
        .article-rich-content-container .tiptap img.article-img-insert.align-center {
          margin-left: auto;
          margin-right: auto;
          max-width: 85%;
        }
        .article-rich-content-container .tiptap img.article-img-insert.align-full {
          width: 100%;
          max-width: 100%;
        }
        .article-rich-content-container .tiptap img.article-img-insert.align-left {
          float: left;
          margin-right: 1.25rem;
          margin-bottom: 0.75rem;
          max-width: 48%;
        }
        .article-rich-content-container .tiptap img.article-img-insert.align-right {
          float: right;
          margin-left: 1.25rem;
          margin-bottom: 0.75rem;
          max-width: 48%;
        }
      `}</style>
    </div>
  );
}

