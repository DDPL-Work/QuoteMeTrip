/**
 * Contact Page (/contact) — Track B.
 *
 * Contact form presentation with client-side validation, isolated API integration,
 * success state, and error handling.
 */

import { useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { SectionHeading, TextInput, Button } from '@troublefree/ui';
import { submitContactForm } from '../../services/public-api.js';
import { usePageMetadata } from '../../hooks/usePageMetadata.js';
import { PublicBreadcrumbs } from '../../components/public/PublicBreadcrumbs.jsx';

export function ContactPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  usePageMetadata(
    'Contact Us - QuoteMeTrip Support',
    'Get in touch with the QuoteMeTrip support team for inquiries, partner agency applications, or trip planning assistance.',
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await submitContactForm(form);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tf-public-container">
      <PublicBreadcrumbs items={[{ label: 'Contact Us' }]} />

      <SectionHeading
        title={t('contact.title', 'Contact Us')}
        subtitle={t('contact.subtitle', 'Have questions or feedback? Get in touch with our team.')}
      />

      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        <div className="tf-card" style={{ padding: '2rem' }}>
          {success ? (
            <div className="tf-notice" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <h3 style={{ marginTop: 0 }}>Message Sent</h3>
              <p>{t('contact.success', 'Thank you! Your message has been sent successfully.')}</p>
              <button
                type="button"
                className="tf-btn tf-btn-ghost"
                onClick={() => setSuccess(false)}
                style={{ marginTop: '1rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <p className="tf-error" role="alert" style={{ marginBottom: '1.25rem' }}>
                  {error}
                </p>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <TextInput
                  id="contact-name"
                  label={t('contact.name', 'Your Name')}
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <TextInput
                  id="contact-email"
                  label={t('contact.email', 'Your Email')}
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <TextInput
                  id="contact-subject"
                  label={t('contact.subject', 'Subject')}
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <TextInput
                  id="contact-message"
                  label={t('contact.message', 'Message')}
                  textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? 'Sending...' : t('contact.send', 'Send Message')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
