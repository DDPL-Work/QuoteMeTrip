/**
 * Quotation constants (Phase 5).
 */
import {
  QUOTATION_STATUSES,
  QUOTATION_TYPES,
  QUOTATION_TRANSITIONS,
} from '../../db/models/Quotation.js';
import { QUOTATION_ITEM_TYPES } from '../../db/models/QuotationItem.js';

export const QUOTATION_ERROR_CODES = {
  VALIDATION_ERROR: 'QUOTATION_VALIDATION_ERROR',
  NOT_FOUND: 'QUOTATION_NOT_FOUND',
  FORBIDDEN: 'QUOTATION_FORBIDDEN',
  INVALID_TRANSITION: 'QUOTATION_INVALID_TRANSITION',
  DUPLICATE: 'QUOTATION_DUPLICATE',
  NOT_MATCHED: 'QUOTATION_NOT_MATCHED',
};

export { QUOTATION_STATUSES, QUOTATION_TYPES, QUOTATION_TRANSITIONS, QUOTATION_ITEM_TYPES };

/** Quotation rows that block creating a new draft for the same pair. */
export const ACTIVE_QUOTATION_STATUSES = ['draft', 'submitted'];
