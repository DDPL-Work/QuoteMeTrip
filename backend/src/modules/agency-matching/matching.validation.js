/**
 * Agency-matching + inbox validation (Phase 5, backend-authoritative).
 */
import { ValidationError } from '../../utils/errors.js';
import { MATCH_ERROR_CODES } from './matching.constants.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: MATCH_ERROR_CODES.VALIDATION_ERROR, details });
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
  return { page, pageSize };
}

export function validateInboxQuery(query = {}) {
  const { page, pageSize } = validatePagination(query);
  const output = { page, pageSize };
  if (query.matchStatus !== undefined && query.matchStatus !== '') {
    const allowed = ['matched', 'viewed', 'quoted', 'declined', 'expired', 'withdrawn'];
    if (!allowed.includes(query.matchStatus)) {
      throw invalid(`matchStatus must be one of: ${allowed.join(', ')}.`);
    }
    output.matchStatus = query.matchStatus;
  }
  if (query.status !== undefined && query.status !== '') {
    const allowed = [
      'draft',
      'submitted',
      'matching',
      'quoted',
      'accepted',
      'cancelled',
      'completed',
    ];
    if (!allowed.includes(query.status)) {
      throw invalid(`status must be a valid travel-request status.`);
    }
    output.status = query.status;
  }
  if (query.from !== undefined && query.from !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(query.from)) || Number.isNaN(Date.parse(query.from))) {
      throw invalid('from must be a valid YYYY-MM-DD date.');
    }
    output.from = String(query.from);
  }
  if (query.to !== undefined && query.to !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(query.to)) || Number.isNaN(Date.parse(query.to))) {
      throw invalid('to must be a valid YYYY-MM-DD date.');
    }
    output.to = String(query.to);
  }
  if (output.from && output.to && output.to < output.from) {
    throw invalid('to cannot be before from.');
  }
  if (query.destination !== undefined && query.destination !== '') {
    const text = String(query.destination).trim();
    if (!text || text.length > 190) {
      throw invalid('destination must be 1–190 characters.');
    }
    output.destination = text;
  }
  return output;
}
