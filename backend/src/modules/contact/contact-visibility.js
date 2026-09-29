/**
 * Contact visibility + protection (Phase 6).
 *
 * Single source of truth for the business rule:
 *
 *   not accepted → hidden
 *   accepted     → visible
 *
 * "Accepted" is state-driven: contact is revealed for a travel request
 * iff a live job exists for it (job created at acceptance with status
 * accepted/in_progress/completed). A cancelled job hides contact again.
 * Enforcement happens in serializers (authorization layer) — never in
 * React. Message bodies additionally get conservative display-time
 * masking (see maskContactDetails) with documented limitations.
 */
import { initModels } from '../../db/models/index.js';

export const LIVE_JOB_STATUSES = ['accepted', 'in_progress', 'completed'];

export async function isContactRevealedForRequest(
  travelRequestId,
  { transaction = null, registry = null } = {},
) {
  const models = registry || initModels();
  const job = await models.Job.findOne({
    where: { travelRequestId, status: LIVE_JOB_STATUSES },
    transaction,
  });
  return job !== null;
}

export function getTravellerContact(user, travellerProfile, { revealed = false } = {}) {
  const firstName = travellerProfile?.firstName ?? null;
  if (!revealed) {
    return { firstName };
  }
  return {
    firstName,
    lastName: travellerProfile?.lastName ?? null,
    email: user?.email ?? null,
    phone: travellerProfile?.phone ?? null,
  };
}

export function getAgencyContact(agency, { revealed = false } = {}) {
  if (!agency) {
    return null;
  }
  const base = {
    id: agency.id,
    agencyName: agency.agencyName,
    city: agency.city ?? null,
    country: agency.country ?? null,
  };
  if (!revealed) {
    return base;
  }
  return {
    ...base,
    contactPerson: agency.contactPerson ?? null,
    businessEmail: agency.businessEmail ?? null,
    phone: agency.phone ?? null,
  };
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{6,}\d)/g;

/**
 * Conservative display-time masking for message bodies when contact is
 * not revealed. Applied at serialization (stored text is untouched).
 *
 * Limitations (documented): determined users can obfuscate contact
 * details (spaces, words for digits, images); masking is a safety net,
 * not a guarantee. The authoritative protection is field-level
 * serialization (email/phone fields are never sent pre-acceptance).
 */
export function maskContactDetails(text) {
  if (text === null || text === undefined) {
    return text;
  }
  return String(text)
    .replace(EMAIL_PATTERN, '[hidden contact]')
    .replace(PHONE_PATTERN, (match) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 7 ? '[hidden contact]' : match;
    });
}
