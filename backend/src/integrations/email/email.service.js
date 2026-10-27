/**
 * Nodemailer email dispatch service for QuoteMeTrip.
 *
 * Implements SMTP transport with resilience:
 * - Real SMTP delivery when credentials exist
 * - Safe mock/logging in development/test when SMTP is not yet configured
 * - Never logs secrets, passwords, or OTP codes in plain text
 */
import nodemailer from 'nodemailer';
import { getEmailConfig } from './email.config.js';
import {
  getPasswordResetOtpTemplate,
  getPasswordResetSuccessTemplate,
} from './email.templates.js';

let customTransporter = null;
let defaultTransporter = null;

export function setCustomTransporter(transporter) {
  customTransporter = transporter;
}

export function resetTransporter() {
  customTransporter = null;
  defaultTransporter = null;
}

export function getTransporter() {
  if (customTransporter) {
    return customTransporter;
  }

  if (defaultTransporter) {
    return defaultTransporter;
  }

  const config = getEmailConfig();

  if (config.isConfigured) {
    defaultTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } else {
    // Development/Test mock transporter: safe logging without exposing OTP or crashing
    defaultTransporter = {
      sendMail: async (options) => {
        const maskedTo = options.to ? String(options.to).replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown';
        console.log(`[EmailService:Mock] Email dispatch simulated: to=${maskedTo}, subject="${options.subject}" (SMTP not configured in local environment)`);
        return {
          messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          accepted: [options.to],
          rejected: [],
          response: '250 Mock email accepted for simulated delivery',
        };
      },
      verify: async () => true,
    };
  }

  return defaultTransporter;
}

/**
 * Send password reset 6-digit OTP email.
 */
export async function sendPasswordResetOtpEmail({ to, name, otp, expiresInMinutes = 10 }) {
  const config = getEmailConfig();
  const transporter = getTransporter();
  const { html, text } = getPasswordResetOtpTemplate({ name, otp, expiresInMinutes });

  const mailOptions = {
    from: config.from,
    to,
    subject: 'QuoteMeTrip Password Reset Verification Code',
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const maskedTo = to ? String(to).replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown';
    console.log(`[EmailService] Password reset OTP sent to ${maskedTo} (messageId: ${info?.messageId || 'ok'})`);
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send password reset OTP email:', err.message);
    throw new Error('Could not deliver verification code. Please check email configuration or try again.');
  }
}

/**
 * Send password reset success confirmation notice.
 */
export async function sendPasswordResetSuccessEmail({ to, name }) {
  const config = getEmailConfig();
  const transporter = getTransporter();
  const { html, text } = getPasswordResetSuccessTemplate({ name });

  const mailOptions = {
    from: config.from,
    to,
    subject: 'Your QuoteMeTrip Password Has Been Reset',
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send password reset success email:', err.message);
    // Non-blocking: password was already reset in database, logging failure is sufficient
    return { success: false, error: err.message };
  }
}
