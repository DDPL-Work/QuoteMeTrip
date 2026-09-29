/**
 * Job output mapper (Phase 6).
 *
 * Participant contact follows the same reveal rule as everywhere
 * else: a live job reveals contact, so job payloads always carry full
 * contact (a job only exists post-acceptance). Cancelled jobs hide
 * contact again.
 */
import { getTravellerContact, getAgencyContact } from '../contact/contact-visibility.js';

export function toPublicJob(job, { traveller = null, agency = null } = {}) {
  return {
    id: job.id,
    travelRequestId: job.travelRequestId,
    quotationId: job.quotationId,
    travellerId: job.travellerId,
    agencyId: job.agencyId,
    status: job.status,
    acceptedAt: job.acceptedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    cancelledAt: job.cancelledAt,
    traveller: traveller.participant,
    agency: agency.participant,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function jobTravellerSnippet(user, profile, { revealed }) {
  return { participant: getTravellerContact(user, profile, { revealed }) };
}

export function jobAgencySnippet(agency, { revealed }) {
  return { participant: getAgencyContact(agency, { revealed }) };
}
