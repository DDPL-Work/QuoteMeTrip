/**
 * Messaging output mappers (Phase 6).
 *
 * Contact protection: participant snippets expose contact fields only
 * when the request's contact is revealed (live job). Message bodies
 * are display-masked while hidden (stored text untouched).
 */
import {
  getTravellerContact,
  getAgencyContact,
  maskContactDetails,
} from '../contact/contact-visibility.js';

export function toPublicMessage(message, { revealed = false } = {}) {
  const body = revealed ? message.body : maskContactDetails(message.body);
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    messageType: message.messageType,
    body,
    metadata: message.metadata ?? null,
    readAt: message.readAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function toPublicConversation(
  conversation,
  { revealed = false, traveller = null, agency = null, lastMessage = null } = {},
) {
  return {
    id: conversation.id,
    travelRequestId: conversation.travelRequestId,
    travellerId: conversation.travellerId,
    agencyId: conversation.agencyId,
    status: conversation.status,
    contactRevealed: revealed,
    traveller: traveller.participant,
    agency: agency.participant,
    lastMessage: lastMessage ? toPublicMessage(lastMessage, { revealed }) : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function travellerSnippet(user, profile, { revealed }) {
  return { participant: getTravellerContact(user, profile, { revealed }) };
}

export function agencySnippet(agency, { revealed }) {
  return { participant: getAgencyContact(agency, { revealed }) };
}
