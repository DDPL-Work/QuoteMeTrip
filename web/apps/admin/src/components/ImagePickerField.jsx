import { useState, useRef } from 'react';
import {
  FiImage,
  FiUploadCloud,
  FiLink,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { adminApi, apiClient, apiBaseUrl } from '../services/api.js';

export function ImagePickerField({
  label = 'Featured Image',
  value = '',
  altValue = '',
  onChangeUrl,
  onChangeAlt,
  recommendedDimensions = '1200 x 630 px (16:9)',
}) {
  const [mode, setMode] = useState(() => (value && value.startsWith('/uploads/') ? 'upload' : 'url'));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    // Validate mime
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setImgError(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const payload = {
            data: base64Data,
            name: file.name,
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

          if (res?.url) {
            onChangeUrl(res.url);
          } else {
            throw new Error('Upload succeeded but no URL was returned.');
          }
        } catch (err) {
          setUploadError(err?.message || 'Failed to upload image.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(err?.message || 'File read error.');
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fakeEvent = { target: { files: e.dataTransfer.files } };
      handleFileChange(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearImage = () => {
    onChangeUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImgError(false);
    setUploadError(null);
  };

  const fullDisplayUrl = getFullImageUrl(value);

  return (
    <div className="admin-form-group" style={{ gap: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="admin-form-label" style={{ margin: 0 }}>
          <FiImage style={{ color: 'var(--admin-primary)' }} /> {label}
        </label>
        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
          Recommended: {recommendedDimensions}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: 'inline-flex',
          background: '#F1F5F9',
          padding: '3px',
          borderRadius: '8px',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '4px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: mode === 'url' ? '#FFFFFF' : 'transparent',
            color: mode === 'url' ? '#0F172A' : '#64748B',
            boxShadow: mode === 'url' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <FiLink /> Image URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '4px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: mode === 'upload' ? '#FFFFFF' : 'transparent',
            color: mode === 'upload' ? '#0F172A' : '#64748B',
            boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <FiUploadCloud /> Local Upload
        </button>
      </div>

      {/* Mode 1: URL Input */}
      {mode === 'url' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="admin-form-input"
            value={value}
            onChange={(e) => {
              setImgError(false);
              onChangeUrl(e.target.value);
            }}
            placeholder="https://images.unsplash.com/... or /uploads/..."
          />
          {value && (
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={clearImage}
              title="Clear Image"
              style={{ padding: '0.65rem' }}
            >
              <FiX />
            </button>
          )}
        </div>
      )}

      {/* Mode 2: Upload Area */}
      {mode === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />

          {!value ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                background: '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-primary)' }}>
                  <FiRefreshCw className="admin-spin" style={{ fontSize: '1.5rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Uploading image to media server...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <FiUploadCloud style={{ fontSize: '1.8rem', color: '#64748B' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                    Click to browse or drag & drop image here
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Supports JPG, PNG, WebP up to 5 MB
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                className="admin-form-input"
                value={value}
                style={{ background: '#F8FAFC', color: '#475569' }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ whiteSpace: 'nowrap' }}
              >
                Replace
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={clearImage}
                title="Remove Image"
                style={{ padding: '0.65rem' }}
              >
                <FiX />
              </button>
            </div>
          )}

          {uploadError && (
            <div style={{ marginTop: '0.4rem', color: '#EF4444', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiAlertCircle /> {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Image Preview & Alt text */}
      {value && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            background: '#F8FAFC',
            padding: '0.875rem',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '65px',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#E2E8F0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imgError ? (
              <span style={{ fontSize: '0.7rem', color: '#EF4444', textAlign: 'center', padding: '4px' }}>
                Failed to load
              </span>
            ) : (
              <img
                src={fullDisplayUrl}
                alt="Preview"
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              className="admin-form-label"
              style={{ fontSize: '0.72rem', marginBottom: '0.2rem', color: '#475569' }}
            >
              Image Alt Text (Accessibility & SEO)
            </label>
            <input
              type="text"
              className="admin-form-input"
              value={altValue}
              onChange={(e) => onChangeAlt?.(e.target.value)}
              placeholder="Descriptive text of the image scene..."
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

