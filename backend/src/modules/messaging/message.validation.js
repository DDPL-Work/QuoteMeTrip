/**
 * Messaging validation (Phase 6, backend-authoritative).
 */
import { ValidationError } from '../../utils/errors.js';
import { MAX_MESSAGE_LENGTH } from '../../db/models/Message.js';
import { MESSAGE_ERROR_CODES } from './message.constants.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: MESSAGE_ERROR_CODES.VALIDATION_ERROR, details });
}

function positiveInt(value, field) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw invalid(`${field} must be a positive integer.`);
  }
  return num;
}

export function validateCreateConversationInput(body = {}) {
  if (!body || typeof body !== 'object') {
    throw invalid('Request body must be an object.');
  }
  const travelRequestId = body.travelRequestId ?? body.travel_request_id;
  if (travelRequestId === undefined) {
    throw invalid('travelRequestId is required.');
  }
  const output = { travelRequestId: positiveInt(travelRequestId, 'travelRequestId') };
  if (body.agencyId !== undefined && body.agencyId !== null) {
    output.agencyId = positiveInt(body.agencyId ?? body.agency_id, 'agencyId');
  }
  return output;
}

export function validateSendMessageInput(body = {}) {
  if (!body || typeof body !== 'object') {
    throw invalid('Request body must be an object.');
  }
  const raw = body.body;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw invalid('Message body must not be empty.');
  }
  const text = raw.trim();
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw invalid(`Message body must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }
  return { body: text };
}

export function validatePagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1 || page > 10000) {
    throw invalid('page must be an integer between 1 and 10000.');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw invalid('pageSize must be an integer between 1 and 100.');
  }
  const result = { page, pageSize };
  if (query.travelRequestId !== undefined && query.travelRequestId !== null) {
    result.travelRequestId = Number(query.travelRequestId);
  }
  return result;
}

export function validateMessagePagination(query = {}) {
  const limit =
    query.limit === undefined
      ? query.pageSize === undefined
        ? 30
        : Number(query.pageSize)
      : Number(query.limit);
  const before =
    query.before !== undefined && query.before !== null && query.before !== ''
      ? Number(query.before)
      : null;
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw invalid('limit must be an integer between 1 and 100.');
  }
  if (before !== null && (!Number.isInteger(before) || before < 1)) {
    throw invalid('before must be a positive integer message ID.');
  }
  return { limit, before, page };
}

export function validateDeleteMessageInput(body = {}, query = {}) {
  const mode = String(body?.mode || query?.mode || 'me')
    .toLowerCase()
    .trim();
  if (!['me', 'everyone'].includes(mode)) {
    throw invalid('Deletion mode must be either "me" or "everyone".');
  }
  return { mode };
}
