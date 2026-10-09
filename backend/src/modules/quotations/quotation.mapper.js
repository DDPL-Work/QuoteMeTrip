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
  const snippet = getAgencyContact(agency, { revealed });
  if (agency.ratingSummary !== undefined) {
    snippet.ratingSummary = agency.ratingSummary;
  }
  return snippet;
}

export function toPublicQuotation(quotation, { agency = null, revealed = false } = {}) {
  const items = (quotation.items || []).slice().sort((a, b) => a.id - b.id);
  const version = Number(quotation.version ?? 1) || 1;
  return {
    id: quotation.id,
    travelRequestId: quotation.travelRequestId,
    agencyId: quotation.agencyId,
    status: quotation.status,
    version,
    parentQuotationId: quotation.parentQuotationId ?? null,
    isRevised: version > 1,
    quotationType: quotation.quotationType,
    currency: quotation.currency,
    subtotal: Number(quotation.subtotal),
    taxRate: Number(quotation.taxRate ?? 0),
    taxAmount: Number(quotation.taxAmount ?? 0),
    taxLabel: quotation.taxLabel ?? null,
    totalAmount: Number(quotation.totalAmount),
    validUntil: quotation.validUntil,
    notes: quotation.notes,
    greeting: quotation.greeting ?? null,
    packageOverview: quotation.packageOverview ?? null,
    itineraryDays: Array.isArray(quotation.itineraryDays) ? quotation.itineraryDays : [],
    paymentDetails: quotation.paymentDetails ?? null,
    inclusions: Array.isArray(quotation.inclusions) ? quotation.inclusions : [],
    exclusions: Array.isArray(quotation.exclusions) ? quotation.exclusions : [],
    termsSections: Array.isArray(quotation.termsSections) ? quotation.termsSections : [],
    branding: quotation.branding ?? null,
    submittedAt: quotation.submittedAt,
    items: items.map(toPublicItem),
    agency: agency ? toPublicAgencySnippet(agency, { revealed }) : undefined,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
  };
}
