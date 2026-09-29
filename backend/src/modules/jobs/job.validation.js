/**
 * Job validation (Phase 6, backend-authoritative).
 */
import { ValidationError } from '../../utils/errors.js';
import { JOB_STATUSES } from '../../db/models/Job.js';
import { JOB_ERROR_CODES } from './job.constants.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: JOB_ERROR_CODES.VALIDATION_ERROR, details });
}

export function validateJobStatusInput(body = {}) {
  if (!body || typeof body !== 'object') {
    throw invalid('Request body must be an object.');
  }
  const status = body.status;
  if (!JOB_STATUSES.includes(status)) {
    throw invalid(`status must be one of: ${JOB_STATUSES.join(', ')}.`);
  }
  return { status };
}
