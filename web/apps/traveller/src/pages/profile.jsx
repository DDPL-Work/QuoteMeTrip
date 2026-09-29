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
import { useI18n } from '@troublefree/i18n';
import { travellerApi } from '../lib/api.js';
import { useAuth } from '../features/auth/auth-context.js';
import { TravellerDetails } from '../components/TravellerDetails.jsx';
import { Icons } from '../components/icons.jsx';

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
          <Icons.CheckCircle aria-hidden="true" style={{ marginRight: '8px' }} /> Profile saved successfully.
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

        {/* Right Column: Profile Summary & Account Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Identity Summary Card */}
          <Card title="Account Overview">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}
            >
              <Avatar name={displayName} size="lg" />
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>{displayName}</h2>
                <div style={{ color: 'var(--tf-portal-text-muted)', fontSize: '0.9rem' }}>
                  {displayEmail}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <StatusBadge status={accountStatus} label={`Account: ${accountStatus}`} />
                  <StatusBadge status="active" label="Role: Traveller" />
                </div>
              </div>
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
              If you lost a device or suspect unauthorized access, you can sign out from all active
              sessions across all devices.
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
  );
}
