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

function validateTaxRate(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100) {
    throw invalid('taxRate must be a number between 0 and 100.');
  }
  return Math.round(num * 100) / 100;
}

function validateTaxLabel(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value).slice(0, 190);
}

function validateGreeting(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return {
    recipient: value.recipient ? String(value.recipient).slice(0, 190) : '',
    title: value.title ? String(value.title).slice(0, 190) : '',
    message: value.message ? String(value.message).slice(0, 3000) : '',
  };
}

function validatePackageOverview(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return {
    tripId: value.tripId ? String(value.tripId).slice(0, 100) : null,
    destination: value.destination ? String(value.destination).slice(0, 255) : '',
    startDate: value.startDate ? String(value.startDate).slice(0, 50) : null,
    endDate: value.endDate ? String(value.endDate).slice(0, 50) : null,
    duration: value.duration ? String(value.duration).slice(0, 100) : '',
    adults: Number(value.adults) || 0,
    children: Number(value.children) || 0,
    infants: Number(value.infants) || 0,
    luggage: value.luggage ? String(value.luggage).slice(0, 100) : '',
  };
}

function validateItineraryDays(list) {
  if (!list || !Array.isArray(list)) return [];
  if (list.length > 60) {
    throw invalid('Itinerary supports at most 60 days.');
  }
  return list.map((d, idx) => ({
    dayNumber: Number(d.dayNumber ?? idx + 1),
    weekday: d.weekday ? String(d.weekday).slice(0, 50) : '',
    date: d.date ? String(d.date).slice(0, 50) : '',
    title: d.title ? String(d.title).slice(0, 255) : `Day ${idx + 1}`,
    description: d.description ? String(d.description).slice(0, 5000) : '',
    city: d.city ? String(d.city).slice(0, 190) : '',
    hotelNotes: d.hotelNotes ? String(d.hotelNotes).slice(0, 1000) : '',
    activityNotes: d.activityNotes ? String(d.activityNotes).slice(0, 1000) : '',
  }));
}

function validatePaymentDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return {
    includePaymentDetails: Boolean(value.includePaymentDetails),
    bankName: value.bankName ? String(value.bankName).slice(0, 190) : '',
    accountHolder: value.accountHolder ? String(value.accountHolder).slice(0, 190) : '',
    accountNumber: value.accountNumber ? String(value.accountNumber).slice(0, 100) : '',
    ifsc: value.ifsc ? String(value.ifsc).slice(0, 50) : '',
    branch: value.branch ? String(value.branch).slice(0, 190) : '',
    instructions: value.instructions ? String(value.instructions).slice(0, 2000) : '',
  };
}

function validateStringList(list, name = 'items') {
  if (!list || !Array.isArray(list)) return [];
  if (list.length > 100) {
    throw invalid(`${name} list supports at most 100 items.`);
  }
  return list.map((item) => String(item).slice(0, 1000)).filter(Boolean);
}

function validateTermsSections(list) {
  if (!list || !Array.isArray(list)) return [];
  if (list.length > 50) {
    throw invalid('Terms supports at most 50 sections.');
  }
  return list.map((sec, idx) => ({
    title: sec.title ? String(sec.title).slice(0, 190) : `Section ${idx + 1}`,
    content: sec.content ? String(sec.content).slice(0, 10000) : '',
    points: Array.isArray(sec.points) ? sec.points.map((p) => String(p).slice(0, 2000)) : [],
    enabled: sec.enabled !== undefined ? Boolean(sec.enabled) : true,
    sortOrder: Number(sec.sortOrder ?? idx + 1),
  }));
}

function validateBranding(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return {
    logoUrl: value.logoUrl ? String(value.logoUrl).slice(0, 500) : null,
    agencyName: value.agencyName ? String(value.agencyName).slice(0, 190) : null,
    address: value.address ? String(value.address).slice(0, 500) : null,
    phone: value.phone ? String(value.phone).slice(0, 50) : null,
    email: value.email ? String(value.email).slice(0, 190) : null,
    footerBannerUrl: value.footerBannerUrl ? String(value.footerBannerUrl).slice(0, 500) : null,
  };
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

  // Document builder extensions
  const taxRateVal = body.taxRate ?? body.tax_rate;
  if (taxRateVal !== undefined) {
    output.taxRate = validateTaxRate(taxRateVal);
  }
  const taxLabelVal = body.taxLabel ?? body.tax_label;
  if (taxLabelVal !== undefined) {
    output.taxLabel = validateTaxLabel(taxLabelVal);
  }
  if (body.greeting !== undefined) {
    output.greeting = validateGreeting(body.greeting);
  }
  const pkgVal = body.packageOverview ?? body.package_overview;
  if (pkgVal !== undefined) {
    output.packageOverview = validatePackageOverview(pkgVal);
  }
  const itinVal = body.itineraryDays ?? body.itinerary_days;
  if (itinVal !== undefined) {
    output.itineraryDays = validateItineraryDays(itinVal);
  }
  const paymentVal = body.paymentDetails ?? body.payment_details;
  if (paymentVal !== undefined) {
    output.paymentDetails = validatePaymentDetails(paymentVal);
  }
  if (body.inclusions !== undefined) {
    output.inclusions = validateStringList(body.inclusions, 'inclusions');
  }
  if (body.exclusions !== undefined) {
    output.exclusions = validateStringList(body.exclusions, 'exclusions');
  }
  const termsVal = body.termsSections ?? body.terms_sections;
  if (termsVal !== undefined) {
    output.termsSections = validateTermsSections(termsVal);
  }
  if (body.branding !== undefined) {
    output.branding = validateBranding(body.branding);
  }

  // Explicitly rejected: client-supplied totals are never trusted.
  if (
    body.subtotal !== undefined ||
    body.totalAmount !== undefined ||
    body.total_amount !== undefined ||
    body.taxAmount !== undefined ||
    body.tax_amount !== undefined
  ) {
    throw invalid('Totals are calculated by the server. Do not send subtotal, taxAmount, or totalAmount.');
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
    'taxRate',
    'tax_rate',
    'taxLabel',
    'tax_label',
    'greeting',
    'packageOverview',
    'package_overview',
    'itineraryDays',
    'itinerary_days',
    'paymentDetails',
    'payment_details',
    'inclusions',
    'exclusions',
    'termsSections',
    'terms_sections',
    'branding',
  ];
  // Totals are rejected first with the specific server-totals message
  if (
    body.subtotal !== undefined ||
    body.totalAmount !== undefined ||
    body.total_amount !== undefined ||
    body.taxAmount !== undefined ||
    body.tax_amount !== undefined
  ) {
    throw invalid('Totals are calculated by the server. Do not send subtotal, taxAmount, or totalAmount.');
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

  // Document builder extensions
  const taxRateVal = body.taxRate ?? body.tax_rate;
  if (taxRateVal !== undefined) {
    output.taxRate = validateTaxRate(taxRateVal);
  }
  const taxLabelVal = body.taxLabel ?? body.tax_label;
  if (taxLabelVal !== undefined) {
    output.taxLabel = validateTaxLabel(taxLabelVal);
  }
  if (body.greeting !== undefined) {
    output.greeting = validateGreeting(body.greeting);
  }
  const pkgVal = body.packageOverview ?? body.package_overview;
  if (pkgVal !== undefined) {
    output.packageOverview = validatePackageOverview(pkgVal);
  }
  const itinVal = body.itineraryDays ?? body.itinerary_days;
  if (itinVal !== undefined) {
    output.itineraryDays = validateItineraryDays(itinVal);
  }
  const paymentVal = body.paymentDetails ?? body.payment_details;
  if (paymentVal !== undefined) {
    output.paymentDetails = validatePaymentDetails(paymentVal);
  }
  if (body.inclusions !== undefined) {
    output.inclusions = validateStringList(body.inclusions, 'inclusions');
  }
  if (body.exclusions !== undefined) {
    output.exclusions = validateStringList(body.exclusions, 'exclusions');
  }
  const termsVal = body.termsSections ?? body.terms_sections;
  if (termsVal !== undefined) {
    output.termsSections = validateTermsSections(termsVal);
  }
  if (body.branding !== undefined) {
    output.branding = validateBranding(body.branding);
  }

  if (Object.keys(output).length === 0) {
    throw invalid('Nothing to update.');
  }
  return output;
}
