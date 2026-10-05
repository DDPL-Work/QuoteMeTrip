import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as service from './traveller.service.js';
import { validateTravellerProfilePatch } from './traveller.validation.js';
import { successResponse } from '../../utils/apiResponse.js';
import { validateFileMetadata } from '../../middleware/upload.js';
import { ValidationError } from '../../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

async function processImageUpload(body = {}, fieldName) {
  const rawImage =
    body[fieldName] ||
    body.image ||
    body.file ||
    body.url ||
    body.data ||
    body.avatar ||
    body.cover ||
    body.profilePicture ||
    body.coverImage;
  const originalName = body.filename || body.name || `${fieldName}.png`;

  if (!rawImage) {
    throw new ValidationError(`No ${fieldName} image provided.`, {
      code: 'NO_FILE_PROVIDED',
    });
  }

  if (
    typeof rawImage === 'string' &&
    (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('/uploads/'))
  ) {
    return rawImage;
  }

  let buffer;
  let mimeType = 'image/png';
  if (typeof rawImage === 'string' && rawImage.includes(';base64,')) {
    const parts = rawImage.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/png';
    buffer = Buffer.from(parts[1], 'base64');
  } else if (typeof rawImage === 'string') {
    buffer = Buffer.from(rawImage, 'base64');
  } else {
    throw new ValidationError('Invalid image payload format.', { code: 'INVALID_IMAGE' });
  }

  const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/webp' ? '.webp' : '.png';
  const meta = validateFileMetadata({
    name: originalName.endsWith(ext) ? originalName : `${originalName}${ext}`,
    type: mimeType,
    size: buffer.length,
  });

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(meta.destinationPath, buffer);

  return `/uploads/${path.basename(meta.destinationPath)}`;
}

async function deleteFileFromStorage(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath || typeof relativeOrAbsolutePath !== 'string') return;
  try {
    const filename = path.basename(relativeOrAbsolutePath);
    if (!filename) return;
    const fullPath = path.resolve(UPLOADS_DIR, filename);
    if (fullPath.startsWith(UPLOADS_DIR)) {
      await fs.unlink(fullPath).catch(() => {});
    }
  } catch (err) {
    // Ignore error if file doesn't exist
  }
}

export const getMe = asyncHandler(async (req, res) => {
  const profile = await service.getMyProfile(req.user.id);
  return successResponse(res, { data: { profile } });
});

export const patchMe = asyncHandler(async (req, res) => {
  const patch = validateTravellerProfilePatch(req.body);
  const profile = await service.updateMyProfile(req.user.id, patch);
  return successResponse(res, { data: { profile }, message: 'Profile updated.' });
});

export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const currentProfile = await service.getMyProfile(req.user.id);
  const oldUrl = currentProfile?.profilePicture || currentProfile?.avatarUrl;
  const url = await processImageUpload(req.body, 'profilePicture');
  const profile = await service.updateMyProfile(req.user.id, { profilePicture: url, avatarUrl: url });

  if (oldUrl && oldUrl !== url && oldUrl.startsWith('/uploads/')) {
    await deleteFileFromStorage(oldUrl);
  }

  return successResponse(res, { data: { profile, url }, message: 'Profile picture updated.' });
});

export const removeProfilePicture = asyncHandler(async (req, res) => {
  const currentProfile = await service.getMyProfile(req.user.id);
  const oldUrl = currentProfile?.profilePicture || currentProfile?.avatarUrl;
  const profile = await service.updateMyProfile(req.user.id, { profilePicture: null, avatarUrl: null });

  if (oldUrl && oldUrl.startsWith('/uploads/')) {
    await deleteFileFromStorage(oldUrl);
  }

  return successResponse(res, { data: { profile }, message: 'Profile picture removed.' });
});

export const uploadCoverImage = asyncHandler(async (req, res) => {
  const currentProfile = await service.getMyProfile(req.user.id);
  const oldUrl = currentProfile?.coverImage || currentProfile?.coverImageUrl;
  const url = await processImageUpload(req.body, 'coverImage');
  const profile = await service.updateMyProfile(req.user.id, { coverImage: url, coverImageUrl: url });

  if (oldUrl && oldUrl !== url && oldUrl.startsWith('/uploads/')) {
    await deleteFileFromStorage(oldUrl);
  }

  return successResponse(res, { data: { profile, url }, message: 'Cover image updated.' });
});

export const removeCoverImage = asyncHandler(async (req, res) => {
  const currentProfile = await service.getMyProfile(req.user.id);
  const oldUrl = currentProfile?.coverImage || currentProfile?.coverImageUrl;
  const profile = await service.updateMyProfile(req.user.id, { coverImage: null, coverImageUrl: null });

  if (oldUrl && oldUrl.startsWith('/uploads/')) {
    await deleteFileFromStorage(oldUrl);
  }

  return successResponse(res, { data: { profile }, message: 'Cover image removed.' });
});
