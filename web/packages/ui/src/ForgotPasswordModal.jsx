import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@troublefree/i18n';
import { PasswordInput } from './auth.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_PATTERN = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Multi-step Forgot Password & Recovery Modal
 * Step 1: Request OTP by entering account email.
 * Step 2: Enter 6-digit OTP received via email (with resend cooldown timer).
 * Step 3: Set and confirm new password using secure resetToken held strictly in memory.
 * Step 4: Success confirmation with clear prompt to log in.
 */
export function ForgotPasswordModal({ isOpen, onClose, authApi }) {
  const { t } = useI18n();

  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new_password, 4: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef(null);

  // Clear cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setCooldown(0);
    }
  }, [isOpen]);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Submit email to request OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (authApi?.forgotPassword) {
        await authApi.forgotPassword({ email: cleanEmail });
      }
      setStep(2);
      startCooldown();
    } catch (err) {
      setError(err?.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');

    try {
      if (authApi?.forgotPassword) {
        await authApi.forgotPassword({ email: email.trim() });
      }
      startCooldown();
    } catch (err) {
      setError(err?.message || 'Failed to resend code. Please wait and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const cleanOtp = otp.trim();
    if (!OTP_PATTERN.test(cleanOtp)) {
      setError(t('auth.otpRequired', 'Please enter the 6-digit numeric verification code.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (authApi?.verifyResetOtp) {
        const result = await authApi.verifyResetOtp({
          email: email.trim(),
          otp: cleanOtp,
        });
        setResetToken(result?.resetToken || result?.data?.resetToken || '');
      }
      setStep(3);
    } catch (err) {
      setError(err?.message || 'Invalid or expired code. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 8) {
      setError(t('auth.passwordLengthError', 'Password must be at least 8 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (authApi?.resetPassword) {
        await authApi.resetPassword({
          email: email.trim(),
          resetToken,
          newPassword,
        });
      }
      // Memory cleanup
      setResetToken('');
      setStep(4);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. The authorization may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                {step === 1 && t('auth.forgotPasswordTitle', 'Reset your password')}
                {step === 2 && t('auth.enterOtpTitle', 'Verify 6-Digit Code')}
                {step === 3 && t('auth.setNewPasswordTitle', 'Create New Password')}
                {step === 4 && t('auth.passwordResetSuccess', 'Password Reset Complete')}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {step < 4 ? `Step ${step} of 3` : 'Finished'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0.25rem',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#b91c1c',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {t('auth.forgotPasswordDesc', 'Enter your registered email address to receive a 6-digit security code.')}
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="recovery-email"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}
                >
                  Email Address
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.9375rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {loading ? 'Sending code...' : t('auth.sendCode', 'Send Verification Code')}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {t('auth.enterOtpDesc', { email: email.trim() }, `We sent a verification code to ${email.trim()}. The code will expire in 10 minutes.`)}
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="recovery-otp"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}
                >
                  {t('auth.otpLabel', '6-Digit Verification Code')}
                </label>
                <input
                  id="recovery-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? '#94a3b8' : '#2563eb',
                    fontWeight: 500,
                    cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                  }}
                >
                  {cooldown > 0
                    ? t('auth.resendIn', { seconds: cooldown }, `Resend in ${cooldown}s`)
                    : t('auth.resendCode', 'Resend code')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? 'Verifying...' : t('auth.verifyCode', 'Verify & Continue')}
              </button>
            </form>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {t('auth.setNewPasswordDesc', 'Enter and confirm your new secure password (minimum 8 characters).')}
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="new-password"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}
                >
                  {t('auth.newPassword', 'New Password')}
                </label>
                <PasswordInput
                  id="new-password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="confirm-password"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}
                >
                  {t('auth.confirmPassword', 'Confirm New Password')}
                </label>
                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? 'Updating password...' : t('auth.resetPasswordBtn', 'Reset Password')}
              </button>
            </form>
          )}

          {/* STEP 4: Success confirmation */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                {t('auth.passwordResetSuccess', 'Password Reset Complete')}
              </h4>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {t(
                  'auth.passwordResetSuccessDesc',
                  'Your password has been securely updated. You can now log in with your new password.'
                )}
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {t('auth.backToSignIn', 'Back to Sign In')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
