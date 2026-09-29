/**
 * Quotation output mappers (Phase 5, reveal-aware in Phase 6).
 *
 * Contact protection lives here: agency serializers expose only
 * public business fields until the request's contact is revealed
 * (live job post-acceptance). Email, phone, WhatsApp, and other
 * private contact fields are never included while hidden.
 */
import { getAgencyContact } from '../contact/contact-visibility.js';

function toPublicItem(item) {
  return {
    id: item.id,
    itemType: item.itemType,
    title: item.title,
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    metadata: item.metadata ?? null,
  };
}

export function toPublicAgencySnippet(agency, { revealed = false } = {}) {
  if (!agency) {
    return null;
  }
  return getAgencyContact(agency, { revealed });
}

export function toPublicQuotation(quotation, { agency = null, revealed = false } = {}) {
  const items = (quotation.items || []).slice().sort((a, b) => a.id - b.id);
  return {
    id: quotation.id,
    travelRequestId: quotation.travelRequestId,
    agencyId: quotation.agencyId,
    status: quotation.status,
    quotationType: quotation.quotationType,
    currency: quotation.currency,
    subtotal: Number(quotation.subtotal),
    totalAmount: Number(quotation.totalAmount),
    validUntil: quotation.validUntil,
    notes: quotation.notes,
    submittedAt: quotation.submittedAt,
    items: items.map(toPublicItem),
    agency: agency ? toPublicAgencySnippet(agency, { revealed }) : undefined,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
  };
}
