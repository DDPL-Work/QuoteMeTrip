/**
 * Traveller profile service (Phase 4).
 *
 * Reads/writes the Phase 2 `traveller_profiles` row plus identity
 * fields from `users`. Profile data is auto-attached to travel
 * requests so travellers never re-enter it.
 */
import { initModels } from '../../db/models/index.js';
import { NotFoundError } from '../../utils/errors.js';

function toPublicProfile(user, profile) {
  const profilePicture = profile?.profilePicture ?? null;
  const coverImage = profile?.coverImage ?? null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    phone: profile?.phone ?? null,
    dateOfBirth: profile?.dateOfBirth ?? null,
    gender: profile?.gender ?? null,
    country: profile?.country ?? null,
    city: profile?.city ?? null,
    preferredLocale: profile?.preferredLocale ?? 'en',
    profilePicture,
    coverImage,
    avatarUrl: profilePicture,
    coverImageUrl: coverImage,
  };
}

export async function getMyProfile(userId) {
  const { User, TravellerProfile } = initModels();
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('Traveller not found.', { code: 'TRAVELLER_NOT_FOUND' });
  }
  const profile =
    (await TravellerProfile.findOne({ where: { userId } })) ||
    (await TravellerProfile.create({ userId }));
  return toPublicProfile(user, profile);
}

export async function updateMyProfile(userId, patch) {
  const { User, TravellerProfile } = initModels();
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('Traveller not found.', { code: 'TRAVELLER_NOT_FOUND' });
  }
  let profile = await TravellerProfile.findOne({ where: { userId } });
  if (!profile) {
    profile = await TravellerProfile.create({ userId, ...patch });
  } else {
    await profile.update(patch);
  }
  return toPublicProfile(user, profile);
}
