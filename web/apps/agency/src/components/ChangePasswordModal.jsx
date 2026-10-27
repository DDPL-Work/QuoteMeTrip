import { useState } from 'react';
import { FiLock, FiKey, FiEye, FiEyeOff, FiX, FiCheck, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { authApi } from '../lib/api.js';
import { useI18n } from '@troublefree/i18n';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { t } = useI18n();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError(t('admin.profile.currentPasswordLabel', 'Current Password') + ' is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError(
        t('admin.profile.passwordLengthError', 'New password must be at least 8 characters long.'),
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        t('admin.profile.passwordMatchError', 'New password and confirmation do not match.'),
      );
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(t('admin.profile.successPassword', 'Password changed successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      setError(err?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'agencyModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#E5F2EA',
                color: '#0C4E28',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <FiLock />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {t('admin.profile.tabSecurity', 'Change Password')}
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Update your agency account password
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            aria-label="Close dialog"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {success && (
              <div
                style={{
                  background: '#DEF7EC',
                  border: '1px solid #31C48D',
                  color: '#03543F',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiCheckCircle size={18} /> {success}
              </div>
            )}

            {error && (
              <div
                style={{
                  background: '#FDE8E8',
                  border: '1px solid #F98080',
                  color: '#9B1C1C',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiAlertCircle size={18} /> {error}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                {t('admin.profile.currentPasswordLabel', 'Current Password')} <span style={{ color: '#DC2626' }}>*</span>
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
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
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
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                {t('admin.profile.newPasswordLabel', 'New Password')} <span style={{ color: '#DC2626' }}>*</span>
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
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
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
                  aria-label="Toggle password visibility"
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

            {/* Confirm New Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                {t('admin.profile.confirmPasswordLabel', 'Confirm New Password')} <span style={{ color: '#DC2626' }}>*</span>
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
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
                  aria-label="Toggle password visibility"
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
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.55rem 1.1rem',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              {t('admin.common.cancel', 'Cancel')}
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.55rem 1.25rem',
                background: '#0C4E28',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 4px rgba(12, 78, 40, 0.25)',
              }}
            >
              {loading ? (
                'Updating...'
              ) : (
                <>
                  <FiLock size={15} /> {t('admin.profile.updatePasswordBtn', 'Update Password')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
