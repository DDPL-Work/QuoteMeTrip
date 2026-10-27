/**
 * Email templates for QuoteMeTrip password recovery and security notices.
 *
 * Professional, high-contrast, responsive HTML + clean text fallbacks.
 */

export function getPasswordResetOtpTemplate({ name, otp, expiresInMinutes = 10 }) {
  const safeName = name ? String(name).slice(0, 80) : 'Traveler';

  const text = `Hello ${safeName},

We received a request to reset your QuoteMeTrip account password.

Your verification code is: ${otp}

This code will expire in ${expiresInMinutes} minutes.

Security Notice:
- Never share this code with anyone. QuoteMeTrip staff will never ask for your verification code.
- If you did not request this password reset, please ignore this message or contact support if you suspect unauthorized activity.

Best regards,
The QuoteMeTrip Team
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your QuoteMeTrip Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #147D33; padding: 28px 32px; text-align: left;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
                QuoteMeTrip
              </h1>
              <p style="margin: 4px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">
                Account Security & Password Recovery
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14.5px; line-height: 1.6; color: #475569;">
                We received a request to reset your password. Use the verification code below to verify your identity and set a new password:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F172A; display: inline-block;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 12.5px; color: #64748B; margin-top: 8px;">
                  Expires in <strong>${expiresInMinutes} minutes</strong>
                </span>
              </div>

              <!-- Security Warning Box -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 6px; margin: 0 0 24px;">
                <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #92400E;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. QuoteMeTrip staff will never ask for your verification code.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748B;">
                If you did not request a password reset, you can safely ignore this email. Your password will not change until you verify this code and create a new one.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 12px; color: #94A3B8;">
              <p style="margin: 0 0 4px;">QuoteMeTrip (Troublefree Holiday) · All rights reserved.</p>
              <p style="margin: 0;">This is an automated security transmission. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
}

export function getPasswordResetSuccessTemplate({ name }) {
  const safeName = name ? String(name).slice(0, 80) : 'Traveler';

  const text = `Hello ${safeName},

Your QuoteMeTrip account password was successfully reset.

For your security, all active sessions on other devices and browsers have been signed out. You can now sign in using your new password.

If you did not perform this change, please contact QuoteMeTrip support immediately to protect your account.

Best regards,
The QuoteMeTrip Team
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          <tr>
            <td style="background-color: #147D33; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 800;">
                QuoteMeTrip
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <div style="width: 48px; height: 48px; background-color: #DCFCE7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">
                ✓
              </div>
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0F172A;">
                Password Reset Successful
              </h2>
              <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #334155;">
                Hello <strong>${safeName}</strong>, your account password was successfully updated.
              </p>
              <p style="margin: 0 0 20px; font-size: 13.5px; line-height: 1.6; color: #475569;">
                All active browser and mobile sessions have been invalidated as a security precaution. You may now sign in using your new password.
              </p>
              <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #991B1B;">
                  <strong>Did not make this change?</strong> If you did not reset your password, your account may be compromised. Please contact support immediately.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 12px; color: #94A3B8;">
              <p style="margin: 0;">QuoteMeTrip · Security & Protection</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
}
