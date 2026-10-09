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

export function toPublicMessage(message, { revealed = false, currentUserId = null } = {}) {
  const isDeletedForEveryone = Boolean(message.deletedForEveryoneAt);
  const deletedForUsers = Array.isArray(message.deletedForUsers) ? message.deletedForUsers : [];
  const deletedForMe = currentUserId ? deletedForUsers.includes(Number(currentUserId)) : false;
  const isExpired = Boolean(message.expiresAt && new Date(message.expiresAt) <= new Date());

  let body;
  if (isDeletedForEveryone) {
    body = 'This message was deleted';
  } else if (isExpired) {
    body = 'This message has expired';
  } else {
    body = revealed ? message.body : maskContactDetails(message.body);
  }

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    messageType: message.messageType,
    body,
    metadata: message.metadata ?? null,
    readAt: message.readAt,
    isDeletedForEveryone,
    deletedForMe,
    isExpired,
    expiresAt: message.expiresAt ?? null,
    deletedAt: message.deletedForEveryoneAt ?? null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function toPublicConversation(
  conversation,
  {
    revealed = false,
    traveller = null,
    agency = null,
    lastMessage = null,
    presence = null,
    travelRequest = null,
  } = {},
) {
  return {
    id: conversation.id,
    travelRequestId: conversation.travelRequestId,
    travellerId: conversation.travellerId,
    agencyId: conversation.agencyId,
    status: conversation.status,
    disappearingTtl: conversation.disappearingTtl || 0,
    contactRevealed: revealed,
    traveller: traveller?.participant ?? null,
    agency: agency?.participant ?? null,
    presence: presence || { isOnline: false, lastSeen: null },
    lastMessage: lastMessage ? toPublicMessage(lastMessage, { revealed }) : null,
    travelRequest: travelRequest ?? null,
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
