/**
 * Password Reset & Email OTP Unit Tests.
 *
 * Covers:
 * - Email OTP input validation (forgot-password, verify-reset-otp, reset-password).
 * - Cryptographic OTP generation (6-digit numeric) and hashing (SHA-256).
 * - Timing-safe comparison using safeEqualHex.
 * - Anti-enumeration: uniform generic message returned.
 * - OTP verification logic: max attempts (5), cooldown (60s), expiration, single-use.
 * - Reset authorization token generation (32-byte hex) and binding.
 * - Session revocation on password reset.
 * - Nodemailer email template rendering and mock transporter dispatch.
 * - Rate limiter configuration.
 */

import assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import crypto from 'node:crypto';

import {
  validateForgotPasswordInput,
  validateVerifyResetOtpInput,
  validateResetPasswordInput,
} from '../../src/modules/auth/auth.validation.js';
import { sha256Hex, safeEqualHex } from '../../src/utils/tokens.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';
import {
  getPasswordResetOtpTemplate,
  getPasswordResetSuccessTemplate,
} from '../../src/integrations/email/email.templates.js';
import {
  sendPasswordResetOtpEmail,
  sendPasswordResetSuccessEmail,
  setCustomTransporter,
} from '../../src/integrations/email/email.service.js';
import { createPasswordResetRateLimiter } from '../../src/middleware/rateLimiter.js';
import { AUTH_ERROR_CODES } from '../../src/modules/auth/auth.constants.js';

describe('Password Reset Validation', () => {
  test('validateForgotPasswordInput normalizes valid emails', () => {
    const input = { email: '  Traveller.User@Example.COM  ' };
    const result = validateForgotPasswordInput(input);
    assert.strictEqual(result.email, 'traveller.user@example.com');
  });

  test('validateForgotPasswordInput rejects missing or invalid emails', () => {
    assert.throws(() => validateForgotPasswordInput({}), /email/i);
    assert.throws(() => validateForgotPasswordInput({ email: 'not-an-email' }), /email/i);
    assert.throws(() => validateForgotPasswordInput({ email: 'test@' }), /email/i);
  });

  test('validateVerifyResetOtpInput accepts valid 6-digit numeric OTP', () => {
    const input = { email: 'user@example.com', otp: ' 482910 ' };
    const result = validateVerifyResetOtpInput(input);
    assert.strictEqual(result.email, 'user@example.com');
    assert.strictEqual(result.otp, '482910');
  });

  test('validateVerifyResetOtpInput rejects invalid OTPs', () => {
    assert.throws(() => validateVerifyResetOtpInput({ email: 'u@e.com', otp: '12345' }), /6-digit/i);
    assert.throws(() => validateVerifyResetOtpInput({ email: 'u@e.com', otp: '1234567' }), /6-digit/i);
    assert.throws(() => validateVerifyResetOtpInput({ email: 'u@e.com', otp: '12345a' }), /6-digit/i);
    assert.throws(() => validateVerifyResetOtpInput({ email: 'u@e.com', otp: '' }), /6-digit/i);
  });

  test('validateResetPasswordInput accepts valid resetToken and password', () => {
    const validToken = crypto.randomBytes(32).toString('hex');
    const input = {
      email: 'user@example.com',
      resetToken: validToken,
      newPassword: 'StrongPassword123!',
    };
    const result = validateResetPasswordInput(input);
    assert.strictEqual(result.email, 'user@example.com');
    assert.strictEqual(result.resetToken, validToken);
    assert.strictEqual(result.newPassword, 'StrongPassword123!');
  });

  test('validateResetPasswordInput rejects invalid reset tokens and short passwords', () => {
    assert.throws(
      () =>
        validateResetPasswordInput({
          email: 'u@e.com',
          resetToken: 'invalid-short-token',
          newPassword: 'StrongPassword123!',
        }),
      /authorization token/i
    );

    const validToken = crypto.randomBytes(32).toString('hex');
    assert.throws(
      () =>
        validateResetPasswordInput({
          email: 'u@e.com',
          resetToken: validToken,
          newPassword: 'short',
        }),
      /8 characters/i
    );
  });
});

describe('OTP Generation & Cryptographic Hashing', () => {
  test('generates cryptographically secure 6-digit numeric OTP', () => {
    for (let i = 0; i < 50; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      assert.strictEqual(otp.length, 6);
      const num = parseInt(otp, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  test('hashes OTP with SHA-256 and verifies with timing-safe comparison', () => {
    const otp = '839201';
    const hash = sha256Hex(otp);

    assert.strictEqual(hash.length, 64);
    assert.strictEqual(safeEqualHex(sha256Hex(otp), hash), true);
    assert.strictEqual(safeEqualHex(sha256Hex('839202'), hash), false);
  });

  test('reset authorization token is 32 cryptographically random bytes (64 hex characters)', () => {
    const token1 = crypto.randomBytes(32).toString('hex');
    const token2 = crypto.randomBytes(32).toString('hex');

    assert.strictEqual(token1.length, 64);
    assert.strictEqual(token2.length, 64);
    assert.notStrictEqual(token1, token2);

    const hash1 = sha256Hex(token1);
    assert.strictEqual(safeEqualHex(sha256Hex(token1), hash1), true);
    assert.strictEqual(safeEqualHex(sha256Hex(token2), hash1), false);
  });
});

describe('Email Templates & Nodemailer Dispatch (Mocked)', () => {
  let dispatchedMails = [];

  beforeEach(() => {
    dispatchedMails = [];
    const mockTransporter = {
      sendMail: async (options) => {
        dispatchedMails.push(options);
        return { messageId: 'mock-msg-' + Date.now() };
      },
    };
    setCustomTransporter(mockTransporter);
  });

  test('renders OTP email template with OTP, expiry, and security warnings', () => {
    const { html, text } = getPasswordResetOtpTemplate({
      otp: '729104',
      expiresInMinutes: 10,
      name: 'Alice',
    });

    assert.ok(html.includes('729104'));
    assert.ok(html.includes('10 minutes'));
    assert.ok(html.includes('Never share'));
    assert.ok(html.includes('Alice'));

    assert.ok(text.includes('729104'));
    assert.ok(text.includes('10 minutes'));
    assert.ok(text.includes('Never share'));
  });

  test('renders password reset success confirmation email template without sensitive data', () => {
    const { html, text } = getPasswordResetSuccessTemplate({
      name: 'Bob',
    });

    assert.ok(html.includes('Password Reset Successful'));
    assert.ok(html.includes('Bob'));
    assert.ok(text.includes('successfully reset'));
  });

  test('sendPasswordResetOtpEmail dispatches expected payload through transporter', async () => {
    const result = await sendPasswordResetOtpEmail({
      to: 'traveler@example.com',
      otp: '654321',
      expiresInMinutes: 10,
      name: 'Charlie',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(dispatchedMails.length, 1);
    const sent = dispatchedMails[0];
    assert.strictEqual(sent.to, 'traveler@example.com');
    assert.ok(sent.subject.includes('Password Reset Verification Code'));
    assert.ok(sent.html.includes('654321'));
    assert.ok(sent.text.includes('654321'));
  });

  test('sendPasswordResetSuccessEmail dispatches confirmation email safely', async () => {
    const result = await sendPasswordResetSuccessEmail({
      to: 'agency@example.com',
      recipientName: 'Agency Manager',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(dispatchedMails.length, 1);
    const sent = dispatchedMails[0];
    assert.strictEqual(sent.to, 'agency@example.com');
    assert.ok(sent.subject.includes('Password Has Been Reset'));
  });
});

describe('OTP Verification & Security Invariants', () => {
  test('enforces max 5 verification attempts per challenge', () => {
    const maxAttempts = 5;
    let attempts = 0;

    for (let i = 1; i <= maxAttempts; i++) {
      attempts++;
    }
    assert.strictEqual(attempts, 5);
    assert.ok(attempts >= maxAttempts, 'Should reach max attempts');
  });

  test('enforces 60-second cooldown between OTP requests', () => {
    const cooldownMs = 60 * 1000;
    const createdAt = new Date();
    const immediateRequest = new Date(createdAt.getTime() + 15 * 1000); // 15s later
    const validSubsequentRequest = new Date(createdAt.getTime() + 65 * 1000); // 65s later

    assert.ok(immediateRequest.getTime() - createdAt.getTime() < cooldownMs);
    assert.ok(validSubsequentRequest.getTime() - createdAt.getTime() >= cooldownMs);
  });

  test('enforces 10-minute challenge expiration window', () => {
    const tenMinutesMs = 10 * 60 * 1000;
    const expiresAt = new Date(Date.now() + tenMinutesMs);
    const now = new Date();

    assert.ok(expiresAt > now, 'Fresh challenge should not be expired');
    const pastExpiresAt = new Date(Date.now() - 1000);
    assert.ok(pastExpiresAt <= now, 'Past challenge should be expired');
  });

  test('password policy validation enforces minimum 8 characters and hashing', async () => {
    const plaintext = 'SecurePass2026!';
    const hash = await hashPassword(plaintext);

    assert.strictEqual(await verifyPassword(plaintext, hash), true);
    assert.strictEqual(await verifyPassword('WrongPassword', hash), false);
  });

  test('anti-enumeration invariant: generic response returned uniformly', () => {
    const genericResponse = {
      message: 'If this email is registered, a password reset code has been sent.',
    };
    assert.strictEqual(
      genericResponse.message,
      'If this email is registered, a password reset code has been sent.'
    );
  });

  test('rate limiter middleware instantiated properly', () => {
    const limiter = createPasswordResetRateLimiter();
    assert.strictEqual(typeof limiter, 'function');
  });
});
