/**
 * Authentication output mapper (Phase 3).
 *
 * The ONLY sanctioned way to serialize users for auth responses.
 * Never exposes passwordHash, session records, token hashes, or
 * provider credentials.
 */
export function toPublicUser(user, { profile = null } = {}) {
  if (!user) {
    return null;
  }
  const data = user.get ? user.get({ plain: true }) : { ...user };
  const publicUser = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status,
  };
  if (profile !== null && profile !== undefined) {
    const plain = profile.get ? profile.get({ plain: true }) : { ...profile };
    delete plain.userId;
    publicUser.profile = plain;
  }
  return publicUser;
}
