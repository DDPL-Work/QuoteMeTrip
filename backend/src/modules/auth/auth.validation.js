/**
 * Backend-authoritative auth input validation (Phase 3).
 *
 * Frontend validation is UX only — these checks run on every request.
 * Validators return a sanitized value or throw an AuthError with
 * AUTH_VALIDATION_ERROR. Email normalization (trim + lowercase) is
 * applied consistently before any lookup or creation.
 */
import { AuthError } from '../../utils/errors.js';
import { AUTH_ERROR_CODES } from './auth.constants.js';
import { validatePasswordPolicy } from '../../utils/password.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function invalid(message) {
  return new AuthError(message, { statusCode: 400, code: AUTH_ERROR_CODES.VALIDATION_ERROR });
}

/** Trim + lowercase. The database unique constraint is the final authority. */
export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 190 || !EMAIL_PATTERN.test(normalized)) {
    throw invalid('A valid email address is required.');
  }
  return normalized;
}

export function validatePassword(password) {
  const message = validatePasswordPolicy(password);
  if (message) {
    throw invalid(message);
  }
  return password;
}

export function validateName(name, field = 'Name') {
  const value = String(name || '').trim();
  if (!value || value.length > 120) {
    throw invalid(`${field} is required.`);
  }
  return value;
}

export function validateLoginInput(body = {}) {
  return {
    email: validateEmail(body.email),
    password:
      typeof body.password === 'string' && body.password.length > 0
        ? body.password
        : (() => {
            throw invalid('Password is required.');
          })(),
  };
}

export function validateTravellerRegistration(body = {}) {
  const { email, password } = {
    email: validateEmail(body.email),
    password: validatePassword(body.password),
  };
  if (body.passwordConfirm !== undefined && body.passwordConfirm !== body.password) {
    throw invalid('Password confirmation does not match.');
  }
  return {
    email,
    password,
    name: validateName(body.name),
    firstName: body.firstName !== undefined ? String(body.firstName).trim().slice(0, 80) : null,
    lastName: body.lastName !== undefined ? String(body.lastName).trim().slice(0, 80) : null,
    phone:
      body.phone !== undefined
        ? String(body.phone).trim().slice(0, 30)
        : body.contactNumber !== undefined
          ? String(body.contactNumber).trim().slice(0, 30)
          : null,
  };
}

export function validateAgencyRegistration(body = {}) {
  const { email, password } = {
    email: validateEmail(body.email),
    password: validatePassword(body.password),
  };
  if (body.passwordConfirm !== undefined && body.passwordConfirm !== body.password) {
    throw invalid('Password confirmation does not match.');
  }
  const agencyName = String(body.agencyName || '').trim();
  if (!agencyName || agencyName.length > 160) {
    throw invalid('Agency name is required.');
  }
  return {
    email,
    password,
    name: validateName(body.contactPerson || body.agencyName, 'Contact person'),
    agencyName,
    contactPerson:
      body.contactPerson !== undefined ? String(body.contactPerson).trim().slice(0, 120) : null,
    phone: body.phone !== undefined ? String(body.phone).trim().slice(0, 30) : null,
    city: body.city !== undefined ? String(body.city).trim().slice(0, 80) : null,
    country: body.country !== undefined ? String(body.country).trim().slice(0, 80) : null,
  };
}

export function validateGoogleInput(body = {}) {
  const idToken = String(body.idToken || '').trim();
  if (!idToken) {
    throw invalid('A Google identity token is required.');
  }
  return { idToken };
}
