/**
 * Authentication data access (Phase 3).
 *
 * All auth-related queries live here. Services and controllers must
 * not issue ad-hoc Sequelize queries for identity/session data.
 */
import { Op } from 'sequelize';
import { initModels } from '../../db/models/index.js';

function db(registry = null) {
  return registry || initModels();
}

export async function findUserByEmail(email, { transaction = null, registry = null } = {}) {
  return db(registry).User.findOne({ where: { email }, transaction });
}

export async function findUserById(id, { transaction = null, registry = null } = {}) {
  return db(registry).User.findByPk(id, { transaction });
}

export async function createUser(attributes, { transaction = null, registry = null } = {}) {
  return db(registry).User.create(attributes, { transaction });
}

export async function updateUser(user, attributes, { transaction = null } = {}) {
  return user.update(attributes, { transaction });
}

export async function createTravellerProfile(
  attributes,
  { transaction = null, registry = null } = {},
) {
  return db(registry).TravellerProfile.create(attributes, { transaction });
}

export async function createAgencyProfile(
  attributes,
  { transaction = null, registry = null } = {},
) {
  return db(registry).AgencyProfile.create(attributes, { transaction });
}

/** Load the role-appropriate profile for a user (null when none). */
export async function findProfileForUser(user, { registry = null } = {}) {
  const models = db(registry);
  if (user.role === 'traveller') {
    return models.TravellerProfile.findOne({ where: { userId: user.id } });
  }
  if (user.role === 'agency') {
    return models.AgencyProfile.findOne({ where: { userId: user.id } });
  }
  return null;
}

export async function createSession(attributes, { transaction = null, registry = null } = {}) {
  return db(registry).AuthSession.create(attributes, { transaction });
}

export async function findSessionById(id, { transaction = null, registry = null } = {}) {
  return db(registry).AuthSession.findByPk(id, { transaction });
}

export async function findSessionByTokenHash(
  tokenHash,
  { transaction = null, registry = null } = {},
) {
  return db(registry).AuthSession.findOne({ where: { tokenHash }, transaction });
}

export async function revokeSession(session, { transaction = null } = {}) {
  if (session.revokedAt) {
    return session;
  }
  return session.update({ revokedAt: new Date() }, { transaction });
}

/** Revoke every active session in a token family (reuse response). */
export async function revokeFamilySessions(
  tokenFamily,
  { transaction = null, registry = null } = {},
) {
  const now = new Date();
  await db(registry).AuthSession.update(
    { revokedAt: now },
    { where: { tokenFamily, revokedAt: null }, transaction },
  );
  return now;
}

/** Revoke every active session of a user. Returns the revoked count. */
export async function revokeAllUserSessions(userId, { transaction = null, registry = null } = {}) {
  const [count] = await db(registry).AuthSession.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null }, transaction },
  );
  return count;
}

/**
 * Delete sessions that are expired, or revoked longer than
 * `revokedOlderThanMs` ago. Returns the deleted count.
 */
export async function deleteStaleSessions(
  { revokedOlderThanMs = 30 * 24 * 60 * 60 * 1000, registry = null } = {},
  now = new Date(),
) {
  return db(registry).AuthSession.destroy({
    where: {
      [Op.or]: [
        { expiresAt: { [Op.lt]: now } },
        { revokedAt: { [Op.not]: null, [Op.lt]: new Date(now.getTime() - revokedOlderThanMs) } },
      ],
    },
  });
}

export async function findIdentity(
  provider,
  providerUserId,
  { transaction = null, registry = null } = {},
) {
  return db(registry).AuthIdentity.findOne({
    where: { provider, providerUserId },
    transaction,
  });
}

export function createIdentity(attributes, { transaction = null, registry = null } = {}) {
  return db(registry).AuthIdentity.create(attributes, { transaction });
}

export async function findIdentityForUser(
  userId,
  provider,
  { transaction = null, registry = null } = {},
) {
  return db(registry).AuthIdentity.findOne({
    where: { userId, provider },
    transaction,
  });
}
