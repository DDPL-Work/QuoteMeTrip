/**
 * Traveller profile validation (Phase 4).
 *
 * Backend-authoritative: frontend validation is UX only.
 */
import { ValidationError } from '../../utils/errors.js';

function invalid(message, details = null) {
  return new ValidationError(message, { code: 'TRAVELLER_VALIDATION_ERROR', details });
}

function optionalString(value, { max, field }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const text = String(value).trim();
  if (text.length > max) {
    throw invalid(`${field} must be at most ${max} characters.`);
  }
  return text;
}

export function validateTravellerProfilePatch(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Profile update must be an object.');
  }
  const allowed = [
    'firstName',
    'lastName',
    'phone',
    'dateOfBirth',
    'gender',
    'country',
    'city',
    'preferredLocale',
    'profilePicture',
    'coverImage',
    'avatarUrl',
    'coverImageUrl',
  ];
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw invalid(`Unknown profile fields: ${unknown.join(', ')}.`);
  }

  const output = {};
  if (body.firstName !== undefined)
    output.firstName = optionalString(body.firstName, { max: 80, field: 'First name' });
  if (body.lastName !== undefined)
    output.lastName = optionalString(body.lastName, { max: 80, field: 'Last name' });
  if (body.phone !== undefined)
    output.phone = optionalString(body.phone, { max: 30, field: 'Phone' });
  if (body.country !== undefined)
    output.country = optionalString(body.country, { max: 80, field: 'Country' });
  if (body.city !== undefined) output.city = optionalString(body.city, { max: 80, field: 'City' });

  if (body.dateOfBirth !== undefined) {
    if (body.dateOfBirth === null || body.dateOfBirth === '') {
      output.dateOfBirth = null;
    } else {
      const text = String(body.dateOfBirth).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
        throw invalid('Date of birth must be a valid YYYY-MM-DD date.');
      }
      if (new Date(text).getTime() > Date.now()) {
        throw invalid('Date of birth cannot be in the future.');
      }
      output.dateOfBirth = text;
    }
  }

  if (body.gender !== undefined) {
    const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (body.gender === null || body.gender === '') {
      output.gender = null;
    } else if (!genders.includes(body.gender)) {
      throw invalid(`Gender must be one of: ${genders.join(', ')}.`);
    } else {
      output.gender = body.gender;
    }
  }

  if (body.preferredLocale !== undefined) {
    if (!['en', 'tr'].includes(body.preferredLocale)) {
      throw invalid('Preferred locale must be one of: en, tr.');
    }
    output.preferredLocale = body.preferredLocale;
  }

  if (body.profilePicture !== undefined) {
    output.profilePicture = body.profilePicture ? String(body.profilePicture).trim() : null;
  } else if (body.avatarUrl !== undefined) {
    output.profilePicture = body.avatarUrl ? String(body.avatarUrl).trim() : null;
  }

  if (body.coverImage !== undefined) {
    output.coverImage = body.coverImage ? String(body.coverImage).trim() : null;
  } else if (body.coverImageUrl !== undefined) {
    output.coverImage = body.coverImageUrl ? String(body.coverImageUrl).trim() : null;
  }

  return output;
}
