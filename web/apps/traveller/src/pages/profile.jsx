// Traveller profile page (Phase 2).
//
// Integrates with GET /api/v1/travellers/me and PATCH /api/v1/travellers/me.
// Supports view mode, edit mode, client-side validation, unsaved changes reset,
// immediate auth user update, i18n locale sync, and logout-all sessions.

import { useEffect, useState, useMemo } from 'react';
import {
  PageHeader,
  Card,
  Button,
  TextInput,
  Select,
  Avatar,
  StatusBadge,
  Skeleton,
  ErrorState,
  ConfirmDialog,
} from '@troublefree/ui';
import { FiCamera, FiImage, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';
import { travellerApi, getMediaUrl } from '../lib/api.js';
import { useAuth } from '../features/auth/auth-context.js';
import { TravellerDetails } from '../components/TravellerDetails.jsx';
import { Icons } from '../components/icons.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English (EN)' },
  { value: 'tr', label: 'Türkçe (TR)' },
];

export function ProfilePage() {
  const { user, updateUser, logoutAll } = useAuth();
  const { setLocale, t } = useI18n();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [mediaNotice, setMediaNotice] = useState('');
  const [mediaError, setMediaError] = useState('');

  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    city: '',
    preferredLocale: 'en',
  });

  const loadProfile = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await travellerApi.me();
      const p = data.profile ?? data;
      setProfile(p);
      populateForm(p);
    } catch (err) {
      setFetchError(err?.message || 'Failed to load traveller profile.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (p) => {
    setForm({
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      phone: p.phone ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
      gender: p.gender ?? '',
      country: p.country ?? '',
      city: p.city ?? '',
      preferredLocale: p.preferredLocale ?? 'en',
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.firstName !== (profile.firstName ?? '') ||
      form.lastName !== (profile.lastName ?? '') ||
      form.phone !== (profile.phone ?? '') ||
      form.dateOfBirth !== (profile.dateOfBirth ?? '') ||
      form.gender !== (profile.gender ?? '') ||
      form.country !== (profile.country ?? '') ||
      form.city !== (profile.city ?? '') ||
      form.preferredLocale !== (profile.preferredLocale ?? 'en')
    );
  }, [form, profile]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (form.firstName && form.firstName.trim().length > 80) {
      errors.firstName = 'First name must be at most 80 characters.';
    }
    if (form.lastName && form.lastName.trim().length > 80) {
      errors.lastName = 'Last name must be at most 80 characters.';
    }
    if (form.phone && form.phone.trim().length > 30) {
      errors.phone = 'Phone number must be at most 30 characters.';
    }
    if (form.dateOfBirth) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
        errors.dateOfBirth = 'Date of birth must be YYYY-MM-DD.';
      } else if (new Date(form.dateOfBirth).getTime() > Date.now()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }
    if (form.country && form.country.trim().length > 80) {
      errors.country = 'Country must be at most 80 characters.';
    }
    if (form.city && form.city.trim().length > 80) {
      errors.city = 'City must be at most 80 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setMediaError('Please upload a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMediaError('Profile picture must be under 5MB.');
      return;
    }
    setUploadingAvatar(true);
    setMediaError('');
    setMediaNotice('');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      const res = await travellerApi.uploadProfilePicture({
        profilePicture: base64,
        avatar: base64,
        image: base64,
        filename: file.name,
      });
      const newUrl = res.url || res.profilePicture || res.avatarUrl || res.profile?.profilePicture;
      setProfile((prev) => ({ ...prev, profilePicture: newUrl, avatarUrl: newUrl }));
      updateUser({
        profile: {
          ...(user?.profile || {}),
          profilePicture: newUrl,
          avatarUrl: newUrl,
        },
      });
      setMediaNotice('Profile picture updated successfully.');
    } catch (err) {
      setMediaError(err?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setMediaError('Please upload a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMediaError('Cover image must be under 5MB.');
      return;
    }
    setUploadingCover(true);
    setMediaError('');
    setMediaNotice('');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      const res = await travellerApi.uploadCoverImage({
        coverImage: base64,
        cover: base64,
        image: base64,
        filename: file.name,
      });
      const newUrl = res.url || res.coverImage || res.coverImageUrl || res.profile?.coverImage;
      setProfile((prev) => ({ ...prev, coverImage: newUrl, coverImageUrl: newUrl }));
      updateUser({
        profile: {
          ...(user?.profile || {}),
          coverImage: newUrl,
          coverImageUrl: newUrl,
        },
      });
      setMediaNotice('Cover image updated successfully.');
    } catch (err) {
      setMediaError(err?.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setMediaError('');
    setMediaNotice('');
    try {
      await travellerApi.updateMe({ avatarUrl: null, profilePicture: null });
      setProfile((prev) => ({ ...prev, profilePicture: null, avatarUrl: null }));
      updateUser({
        profile: {
          ...(user?.profile || {}),
          profilePicture: null,
          avatarUrl: null,
        },
      });
      setMediaNotice('Profile picture removed.');
    } catch (err) {
      setMediaError(err?.message || 'Failed to remove profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveCover = async () => {
    setUploadingCover(true);
    setMediaError('');
    setMediaNotice('');
    try {
      await travellerApi.updateMe({ coverImageUrl: null, coverImage: null });
      setProfile((prev) => ({ ...prev, coverImage: null, coverImageUrl: null }));
      updateUser({
        profile: {
          ...(user?.profile || {}),
          coverImage: null,
          coverImageUrl: null,
        },
      });
      setMediaNotice('Cover image removed.');
    } catch (err) {
      setMediaError(err?.message || 'Failed to remove cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Send ONLY allowed backend profile patch fields
      const patchData = {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        preferredLocale: form.preferredLocale || 'en',
      };

      const updated = await travellerApi.updateMe(patchData);
      const newProfile = updated.profile ?? updated;
      setProfile(newProfile);
      populateForm(newProfile);

      // Sync central auth user display name and i18n locale
      const displayName = [newProfile.firstName, newProfile.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      updateUser({
        name: displayName || user?.name,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
      });

      if (newProfile.preferredLocale && setLocale) {
        setLocale(newProfile.preferredLocale);
      }

      setSaveSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) populateForm(profile);
    setFieldErrors({});
    setSaveError('');
    setIsEditing(false);
  };

  const handleConfirmLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAll();
    } catch (err) {
      setSaveError(err?.message || 'Failed to sign out from all devices.');
      setLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  };

  if (loading) {
    return (
      <main className="tf-portal-page" aria-label="Profile loading">
        <PageHeader
          title="Profile"
          subtitle="Personal information used for your travel requests."
        />
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px' }}
        >
          <Skeleton height="200px" borderRadius="12px" />
          <Skeleton height="320px" borderRadius="12px" />
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="tf-portal-page" aria-label="Profile error">
        <PageHeader title="Profile" />
        <ErrorState title="Could not load profile" message={fetchError} onRetry={loadProfile} />
      </main>
    );
  }

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.name || user?.name || 'Traveller';
  const displayEmail = profile?.email || user?.email || '';
  const accountStatus = user?.status || 'active';

  return (
    <MotionPage>
      <main className="tf-portal-page" aria-label="Traveller Profile">
        <PageHeader
          title="Profile"
          subtitle="Your details are automatically used when creating travel requests."
          actions={
            !isEditing ? (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : null
          }
        />

        {saveSuccess ? (
          <div
            className="tf-portal-toast"
            role="status"
            style={{
              marginBottom: '20px',
              background: 'var(--tf-portal-green-soft, #E5F2EA)',
              color: 'var(--tf-portal-green, #147D33)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--tf-portal-green)',
            }}
          >
            <Icons.CheckCircle aria-hidden="true" style={{ marginRight: '8px' }} /> Profile saved
            successfully.
          </div>
        ) : null}

        {saveError ? (
          <div
            role="alert"
            style={{
              marginBottom: '20px',
              background: '#FDF2F2',
              color: '#D32F2F',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #D32F2F',
            }}
          >
            <Icons.AlertCircle aria-hidden="true" style={{ marginRight: '8px' }} /> {saveError}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Personal Information Form / View */}
          <Card title="Personal Information">
            {isEditing ? (
              <form onSubmit={handleSave} noValidate aria-label="Edit Profile Form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <TextInput
                    id="firstName"
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    error={fieldErrors.firstName}
                    disabled={submitting}
                  />
                  <TextInput
                    id="lastName"
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    error={fieldErrors.lastName}
                    disabled={submitting}
                  />
                </div>

                <TextInput
                  id="phone"
                  label="Phone / WhatsApp"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  error={fieldErrors.phone}
                  helpText="Format: +90 5XX XXX XX XX"
                  disabled={submitting}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <TextInput
                    id="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                    error={fieldErrors.dateOfBirth}
                    disabled={submitting}
                  />
                  <Select
                    id="gender"
                    label="Gender"
                    options={GENDER_OPTIONS}
                    value={form.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    error={fieldErrors.gender}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <TextInput
                    id="country"
                    label="Country"
                    value={form.country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    error={fieldErrors.country}
                    disabled={submitting}
                  />
                  <TextInput
                    id="city"
                    label="City"
                    value={form.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    error={fieldErrors.city}
                    disabled={submitting}
                  />
                </div>

                <Select
                  id="preferredLocale"
                  label="Preferred Interface Language"
                  options={LOCALE_OPTIONS}
                  value={form.preferredLocale}
                  onChange={(e) => handleFieldChange('preferredLocale', e.target.value)}
                  error={fieldErrors.preferredLocale}
                  disabled={submitting}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                  }}
                >
                  <Button
                    variant="line"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={submitting}
                    disabled={submitting || (isEditing && !isDirty)}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <TravellerDetails profile={profile} />
                <div
                  style={{
                    marginTop: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Date of Birth:</strong>
                    <div>{profile?.dateOfBirth || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Gender:</strong>
                    <div style={{ textTransform: 'capitalize' }}>
                      {profile?.gender ? profile.gender.replace('_', ' ') : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Country:</strong>
                    <div>{profile?.country || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--tf-portal-text-muted)' }}>City:</strong>
                    <div>{profile?.city || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--tf-portal-text-muted)' }}>
                      Preferred Language:
                    </strong>
                    <div>{profile?.preferredLocale === 'tr' ? 'Türkçe (TR)' : 'English (EN)'}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Right Column: Profile Summary, Media & Account Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Media & Account Overview Card */}
            <Card title="Profile Photo & Cover Image">
              {mediaNotice && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#E5F2EA',
                    color: '#147D33',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiCheckCircle /> {mediaNotice}
                </div>
              )}
              {mediaError && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#FDF2F2',
                    color: '#D32F2F',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiAlertCircle /> {mediaError}
                </div>
              )}

              {/* Cover Image Preview & Uploader */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--tf-portal-text-primary)' }}>
                    Cover Image
                  </span>
                  {profile?.coverImage || profile?.coverImageUrl ? (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      disabled={uploadingCover}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#D32F2F',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FiTrash2 size={13} /> Remove
                    </button>
                  ) : null}
                </div>

                <div
                  style={{
                    height: '120px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background:
                      profile?.coverImage || profile?.coverImageUrl
                        ? `url("${getMediaUrl(profile.coverImage || profile.coverImageUrl)}") center/cover no-repeat`
                        : 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)',
                    position: 'relative',
                    border: '1px solid var(--tf-portal-border, #E2DCD1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <label
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: uploadingCover ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FiImage size={14} />
                    <span>{uploadingCover ? 'Uploading…' : 'Change Cover'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverFileChange}
                      disabled={uploadingCover}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Avatar Preview & Uploader */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--tf-portal-border-soft, #EDE8E1)',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      background: '#147D33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                    }}
                  >
                    {profile?.profilePicture || profile?.avatarUrl ? (
                      <img
                        src={getMediaUrl(profile.profilePicture || profile.avatarUrl)}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: '1.05rem', color: 'var(--tf-portal-text-primary)' }}>
                    {displayName}
                  </h3>
                  <div style={{ color: 'var(--tf-portal-text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>
                    {displayEmail}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: '#147D33',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: uploadingAvatar ? 'wait' : 'pointer',
                      }}
                    >
                      <FiCamera size={14} />
                      <span>{uploadingAvatar ? 'Uploading…' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarFileChange}
                        disabled={uploadingAvatar}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {(profile?.profilePicture || profile?.avatarUrl) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#D32F2F',
                          border: '1px solid #D32F2F',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <FiTrash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <StatusBadge status={accountStatus} label={`Account: ${accountStatus}`} />
                <StatusBadge status="active" label="Role: Traveller" />
              </div>
            </Card>

            {/* Account Security Card */}
            <Card title="Account Security">
              <p
                style={{
                  color: 'var(--tf-portal-text-muted)',
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                }}
              >
                If you lost a device or suspect unauthorized access, you can sign out from all
                active sessions across all devices.
              </p>
              <Button
                variant="outline"
                style={{
                  color: 'var(--tf-portal-warn, #D32F2F)',
                  borderColor: 'var(--tf-portal-warn, #D32F2F)',
                }}
                onClick={() => setShowLogoutAllModal(true)}
              >
                Sign out from all devices
              </Button>
            </Card>
          </div>
        </div>

        {/* Confirmation Dialog for Logout-All */}
        <ConfirmDialog
          isOpen={showLogoutAllModal}
          onClose={() => setShowLogoutAllModal(false)}
          onConfirm={handleConfirmLogoutAll}
          title="Sign out from all devices?"
          message="This action will end your active sessions on all other devices and web browsers. You will be signed out and redirected to the login page."
          confirmText={loggingOutAll ? 'Signing out…' : 'Sign out everywhere'}
          cancelText="Cancel"
          variant="primary"
        />
      </main>
    </MotionPage>
  );
}
