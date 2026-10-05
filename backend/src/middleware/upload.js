/**
 * Safe File Upload & Validation Middleware (Phase 9 Hardened).
 *
 * Validates extension, MIME type, file size, prevents path traversal,
 * and handles secure local storage.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateFileMetadata(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  let filename = path.basename(file.originalname || file.name || 'file');
  let ext = path.extname(filename).toLowerCase();
  const mimeType = (file.mimetype || file.type || '').toLowerCase();
  const size = file.size || 0;

  if (!ext && mimeType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    ext = mimeToExt[mimeType] || '';
    if (ext) {
      filename = `${filename}${ext}`;
    }
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Invalid file extension: ${ext || '(none)'}. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Invalid MIME type: ${mimeType}. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
    );
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${size} bytes exceeds maximum limit of 5 MB.`);
  }

  // Prevent path traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const destinationPath = path.join(UPLOADS_DIR, `${Date.now()}_${safeFilename}`);

  // Ensure target path stays within UPLOADS_DIR
  if (!destinationPath.startsWith(UPLOADS_DIR)) {
    throw new Error('Path traversal attempt detected.');
  }
 
  return {
    originalName: filename,
    safeFilename,
    extension: ext,
    mimeType,
    size,
    destinationPath,
  };
}
