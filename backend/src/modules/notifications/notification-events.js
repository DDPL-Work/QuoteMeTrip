/**
 * Notification event hooks (Phase 5).
 *
 * Minimal in-process event bus for domain events. Full delivery
 * infrastructure (SMS/email/Firebase) belongs to a later phase: this
 * module only records a structured log line and notifies registered
 * in-process listeners. Listener failures are swallowed — a
 * notification must NEVER corrupt the primary transaction.
 */

export const NOTIFICATION_EVENTS = {
  REQUEST_MATCHED: 'REQUEST_MATCHED',
  QUOTATION_SUBMITTED: 'QUOTATION_SUBMITTED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  QUOTATION_ACCEPTED: 'QUOTATION_ACCEPTED',
  JOB_CREATED: 'JOB_CREATED',
  CONTACT_REVEALED: 'CONTACT_REVEALED',
  AGENCY_APPROVED: 'AGENCY_APPROVED',
  AGENCY_REJECTED: 'AGENCY_REJECTED',
  AGENCY_SUSPENDED: 'AGENCY_SUSPENDED',
  AGENCY_REACTIVATED: 'AGENCY_REACTIVATED',
  DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  MEMBERSHIP_ACTIVATED: 'MEMBERSHIP_ACTIVATED',
  MEMBERSHIP_EXPIRING: 'MEMBERSHIP_EXPIRING',
  MEMBERSHIP_SUSPENDED: 'MEMBERSHIP_SUSPENDED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
};

const listeners = new Map();

/** Register an in-process listener (used by tests/future delivery). */
export function onNotificationEvent(event, listener) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(listener);
  return () => listeners.get(event)?.delete(listener);
}

/** Test hook: drop all listeners. */
export function clearNotificationListeners() {
  listeners.clear();
}

import { handleDomainNotificationEvent } from './domain-notification-handler.js';

export function emitNotificationEvent(event, payload = {}) {
  console.log(
    JSON.stringify({
      type: 'notification',
      event,
      at: new Date().toISOString(),
      ...payload,
    }),
  );

  // Invoke domain notification handler asynchronously (failsafe)
  setImmediate(() => {
    try {
      handleDomainNotificationEvent(event, payload);
    } catch (err) {
      console.error('[NotificationEventBus] Failed to process domain notification:', err.message);
    }
  });

  const targets = listeners.get(event);
  if (!targets) {
    return;
  }
  for (const listener of targets) {
    try {
      listener(payload);
    } catch {
      // Notification failures must never break business flows.
    }
  }
}
