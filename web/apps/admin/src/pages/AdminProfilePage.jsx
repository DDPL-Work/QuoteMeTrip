import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiMail,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiKey,
  FiClock,
  FiCheck,
  FiInfo,
} from 'react-icons/fi';
import { useAuth } from '../features/auth/auth-context.js';
import { authApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';
import { useI18n, formatDate } from '@troublefree/i18n';

export function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleTabChange = (tabKey) => {
    setSearchParams(tabKey === 'password' ? { tab: 'password' } : {});
    setProfileSuccess(null);
    setProfileError(null);
    setPasswordSuccess(null);
    setPasswordError(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setProfileError(t('admin.profile.nameLabel') + ' is required.');
      return;
    }
    if (!trimmedEmail) {
      setProfileError(t('admin.profile.emailLabel') + ' is required.');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await authApi.updateProfile({ name: trimmedName, email: trimmedEmail });
      const updated = res?.user || { name: trimmedName, email: trimmedEmail };
      updateUser(updated);
      setProfileSuccess(t('admin.profile.successProfile', 'Profile details updated successfully.'));
    } catch (err) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(t('admin.profile.currentPasswordLabel', 'Current Password') + ' is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        t('admin.profile.passwordLengthError', 'New password must be at least 8 characters long.'),
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        t('admin.profile.passwordMatchError', 'New password and confirmation do not match.'),
      );
      return;
    }

    try {
      setPasswordLoading(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess(t('admin.profile.successPassword', 'Password changed successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.profile.title', 'Admin Profile & Security')}</h1>
          <p className="admin-page-subtitle">
            {t(
              'admin.profile.subtitle',
              'Manage your administrative identity, email address, and account credentials.',
            )}
          </p>
        </div>
      </div>

      {/* Identity Card */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #09371D 0%, #0F4C28 100%)',
          color: '#ffffff',
          marginBottom: '1.5rem',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(9, 55, 29, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#FC7C00',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(252, 124, 0, 0.35)',
            }}
          >
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
                {displayName}
              </h2>
              <span
                style={{
                  background: 'rgba(252, 124, 0, 0.2)',
                  color: '#FFB266',
                  border: '1px solid rgba(252, 124, 0, 0.4)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                }}
              >
                <FiShield size={12} /> {user?.role || 'admin'}
              </span>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#86EFAC',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                ● {user?.status || 'active'}
              </span>
            </div>

            <p style={{ margin: '0.25rem 0 0.75rem', color: '#D1E7DD', fontSize: '0.9rem' }}>
              {user?.email}
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#A3CFBB' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FiUser size={13} /> {t('admin.profile.userIdLabel', 'User ID')}: #{user?.id || 1}
              </span>
              {user?.lastLoginAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiClock size={13} /> {t('admin.profile.lastLogin', 'Last Login')}:{' '}
                  {formatDate(user.lastLoginAt, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: currentTab === 'profile' ? '3px solid #09371D' : '3px solid transparent',
            color: currentTab === 'profile' ? '#09371D' : '#64748B',
            fontWeight: currentTab === 'profile' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
            transition: 'all 0.15s ease',
          }}
        >
          <FiUser /> {t('admin.profile.tabGeneral', 'Account Profile')}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('password')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: currentTab === 'password' ? '3px solid #09371D' : '3px solid transparent',
            color: currentTab === 'password' ? '#09371D' : '#64748B',
            fontWeight: currentTab === 'password' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
            transition: 'all 0.15s ease',
          }}
        >
          <FiLock /> {t('admin.profile.tabSecurity', 'Change Password')}
        </button>
      </div>

      {/* Tab 1: Account Profile */}
      {currentTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <FiUser /> {t('admin.profile.tabGeneral', 'Account Profile')}
              </h2>
            </div>

            {profileSuccess && (
              <div
                style={{
                  background: '#DEF7EC',
                  border: '1px solid #31C48D',
                  color: '#03543F',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <FiCheckCircle size={18} /> {profileSuccess}
              </div>
            )}

            {profileError && (
              <div
                style={{
                  background: '#FDE8E8',
                  border: '1px solid #F98080',
                  color: '#9B1C1C',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <FiAlertCircle size={18} /> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.nameLabel', 'Display Name')} <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiUser
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.emailLabel', 'Email Address')} <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiMail
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type="email"
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.roleLabel', 'System Role')}
                </label>
                <div style={{ position: 'relative' }}>
                  <FiShield
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem', background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                    value={user?.role?.toUpperCase() || 'ADMIN'}
                    disabled
                  />
                </div>
                <small style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                  System administrator roles are governed by platform security policies.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={profileLoading}
                  style={{ minWidth: '140px' }}
                >
                  {profileLoading ? (
                    'Saving...'
                  ) : (
                    <>
                      <FiCheck size={16} /> {t('admin.profile.saveBtn', 'Save Changes')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Box */}
          <div className="admin-card" style={{ height: 'fit-content' }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ fontSize: '0.95rem' }}>
                <FiInfo /> Account Information
              </h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <strong style={{ color: '#0F172A', display: 'block' }}>Platform Role</strong>
                <span>Primary Super Administrator</span>
              </div>
              <div>
                <strong style={{ color: '#0F172A', display: 'block' }}>Privileges</strong>
                <span>Full marketplace management, agency compliance verification, membership control, financial commission audits.</span>
              </div>
              <div>
                <strong style={{ color: '#0F172A', display: 'block' }}>Session Security</strong>
                <span>Protected with secure HttpOnly cookies and in-memory access tokens.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Change Password */}
      {currentTab === 'password' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <FiKey /> {t('admin.profile.tabSecurity', 'Change Password')}
              </h2>
            </div>

            {passwordSuccess && (
              <div
                style={{
                  background: '#DEF7EC',
                  border: '1px solid #31C48D',
                  color: '#03543F',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <FiCheckCircle size={18} /> {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  background: '#FDE8E8',
                  border: '1px solid #F98080',
                  color: '#9B1C1C',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <FiAlertCircle size={18} /> {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.currentPasswordLabel', 'Current Password')} <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle current password visibility"
                  >
                    {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.newPasswordLabel', 'New Password')} <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiKey
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                <small
                  style={{
                    color: newPassword.length >= 8 ? '#16A34A' : '#94A3B8',
                    fontSize: '0.78rem',
                    marginTop: '0.25rem',
                    display: 'block',
                  }}
                >
                  {newPassword.length >= 8 ? '✓ ' : '• '}
                  {t('admin.profile.passwordLengthError', 'New password must be at least 8 characters long.')}
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {t('admin.profile.confirmPasswordLabel', 'Confirm New Password')} <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiKey
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="admin-form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {confirmPassword && (
                  <small
                    style={{
                      color: newPassword === confirmPassword ? '#16A34A' : '#DC2626',
                      fontSize: '0.78rem',
                      marginTop: '0.25rem',
                      display: 'block',
                    }}
                  >
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={passwordLoading}
                  style={{ minWidth: '160px' }}
                >
                  {passwordLoading ? (
                    'Updating...'
                  ) : (
                    <>
                      <FiLock size={16} /> {t('admin.profile.updatePasswordBtn', 'Update Password')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Best Practices */}
          <div className="admin-card" style={{ height: 'fit-content' }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ fontSize: '0.95rem', color: '#09371D' }}>
                <FiShield /> {t('admin.profile.securityTipsTitle', 'Security Best Practices')}
              </h3>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.25rem',
                fontSize: '0.85rem',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                lineHeight: 1.5,
              }}
            >
              <li>
                {t(
                  'admin.profile.securityTip1',
                  'Use a strong password with at least 8 characters, combining numbers, symbols, and letters.',
                )}
              </li>
              <li>
                {t('admin.profile.securityTip2', 'Do not reuse passwords across multiple applications.')}
              </li>
              <li>
                {t(
                  'admin.profile.securityTip3',
                  'Always log out when accessing administrative portals from shared workstations.',
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
