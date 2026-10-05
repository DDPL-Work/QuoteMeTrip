/**
 * Quotation validation (Phase 5, backend-authoritative).
 *
 * Client totals are never accepted — the service recalculates every
 * line (`quantity × unit_price`) and both aggregates server-side.
 */
import { ValidationError } from '../../utils/errors.js';
import { QUOTATION_TYPES } from '../../db/models/Quotation.js';
import { QUOTATION_ITEM_TYPES } from '../../db/models/QuotationItem.js';
import { QUOTATION_ERROR_CODES } from './quotation.constants.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: QUOTATION_ERROR_CODES.VALIDATION_ERROR, details });
}

function validateMoney(value, { field, min = 0, max = 100000000 }) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw invalid(`${field} must be a number between ${min} and ${max}.`);
  }
  return Math.round(num * 100) / 100;
}

export function validateQuotationItemInput(item, index = 0) {
  if (!item || typeof item !== 'object') {
    throw invalid(`Item at index ${index} must be an object.`);
  }
  const title = String(item.title ?? '').trim();
  if (!title || title.length > 190) {
    throw invalid(`Item at index ${index} requires a title (1–190 characters).`);
  }
  const itemType = item.itemType ?? item.item_type ?? 'other';
  if (!QUOTATION_ITEM_TYPES.includes(itemType)) {
    throw invalid(
      `Item "${title}" has an invalid type. Must be one of: ${QUOTATION_ITEM_TYPES.join(', ')}.`,
    );
  }
  const quantity =
    item.quantity === undefined
      ? 1
      : validateMoney(item.quantity, { field: `Item "${title}" quantity`, min: 0.01, max: 100000 });
  const unitPrice = item.unitPrice ?? item.unit_price ?? 0;
  const unit = validateMoney(unitPrice, { field: `Item "${title}" unit price` });
  const description =
    item.description === undefined || item.description === null
      ? null
      : String(item.description).slice(0, 5000) || null;
  const metadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? item.metadata
      : null;
  return { itemType, title, description, quantity, unitPrice: unit, metadata };
}

export function validateItemsList(items, { required = false } = {}) {
  if (items === undefined || items === null) {
    if (required) {
      throw invalid('At least one quotation item is required.');
    }
    return undefined;
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw invalid('Items must be a non-empty array.');
  }
  if (items.length > 100) {
    throw invalid('A quotation supports at most 100 items.');
  }
  return items.map((item, index) => validateQuotationItemInput(item, index));
}

function validateCurrency(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const code = String(value).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw invalid('Currency must be a 3-letter ISO code (e.g. USD).');
  }
  return code;
}

function validateValidUntil(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw invalid('validUntil must be a valid YYYY-MM-DD date.');
  }
  const today = new Date().toISOString().slice(0, 10);
  if (text < today) {
    throw invalid('validUntil cannot be in the past.');
  }
  return text;
}

export function validateCreateQuotationInput(body = {}) {
  if (!body || typeof body !== 'object') {
    throw invalid('Request body must be an object.');
  }
  const quotationType = body.quotationType ?? body.quotation_type;
  if (!QUOTATION_TYPES.includes(quotationType)) {
    throw invalid(`quotationType must be one of: ${QUOTATION_TYPES.join(', ')}.`);
  }
  const output = { quotationType, items: validateItemsList(body.items, { required: true }) };
  const currency = validateCurrency(body.currency);
  if (currency !== undefined) {
    output.currency = currency;
  }
  const validUntil = validateValidUntil(body.validUntil ?? body.valid_until);
  if (validUntil !== undefined) {
    output.validUntil = validUntil;
  }
  if (body.notes !== undefined && body.notes !== null) {
    const notes = String(body.notes);
    if (notes.length > 5000) {
      throw invalid('Notes must be at most 5000 characters.');
    }
    output.notes = notes;
  }
  // Explicitly rejected: client-supplied totals are never trusted.
  if (
    body.subtotal !== undefined ||
    body.totalAmount !== undefined ||
    body.total_amount !== undefined
  ) {
    throw invalid('Totals are calculated by the server. Do not send subtotal or totalAmount.');
  }
  return output;
}

export function validatePatchQuotationInput(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Request body must be an object.');
  }
  const allowed = [
    'quotationType',
    'quotation_type',
    'currency',
    'validUntil',
    'valid_until',
    'notes',
    'items',
  ];
  // Totals are rejected first with the specific server-totals message
  // (otherwise they would fall through to the generic unknown-fields
  // error below, leaving this check as dead code).
  if (
    body.subtotal !== undefined ||
    body.totalAmount !== undefined ||
    body.total_amount !== undefined
  ) {
    throw invalid('Totals are calculated by the server. Do not send subtotal or totalAmount.');
  }
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw invalid(`Unknown quotation fields: ${unknown.join(', ')}.`);
  }
  const output = {};
  const quotationType = body.quotationType ?? body.quotation_type;
  if (quotationType !== undefined) {
    if (!QUOTATION_TYPES.includes(quotationType)) {
      throw invalid(`quotationType must be one of: ${QUOTATION_TYPES.join(', ')}.`);
    }
    output.quotationType = quotationType;
  }
  const currency = validateCurrency(body.currency);
  if (currency !== undefined) {
    output.currency = currency;
  }
  const validUntil = validateValidUntil(body.validUntil ?? body.valid_until);
  if (validUntil !== undefined) {
    output.validUntil = validUntil;
  }
  if (body.notes !== undefined) {
    output.notes = body.notes === null ? null : String(body.notes).slice(0, 5000);
  }
  const items = validateItemsList(body.items);
  if (items !== undefined) {
    output.items = items;
  }
  if (Object.keys(output).length === 0) {
    throw invalid('Nothing to update.');
  }
  return output;
}
