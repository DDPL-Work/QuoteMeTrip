/**
 * Messaging constants (Phase 6).
 */
import { CONVERSATION_STATUSES } from '../../db/models/Conversation.js';
import { MESSAGE_TYPES, MAX_MESSAGE_LENGTH } from '../../db/models/Message.js';

export const MESSAGE_ERROR_CODES = {
  VALIDATION_ERROR: 'MESSAGE_VALIDATION_ERROR',
  NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  FORBIDDEN: 'MESSAGE_FORBIDDEN',
  DUPLICATE: 'CONVERSATION_DUPLICATE',
};

export { CONVERSATION_STATUSES, MESSAGE_TYPES, MAX_MESSAGE_LENGTH };

export const SOCKET_EVENTS = {
  MESSAGE: 'conversation:message',
  READ: 'conversation:read',
  UPDATED: 'conversation:updated',
  DELETED: 'conversation:deleted',
  DELETED_FOR_EVERYONE: 'MESSAGE_DELETED_FOR_EVERYONE',
  TTL: 'conversation:ttl',
};
