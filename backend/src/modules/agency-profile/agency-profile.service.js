import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import * as repository from './agency-profile.repository.js';
import { validateCoverageInput } from './agency-profile.validation.js';
import { AGENCY_PROFILE_ERROR_CODES } from './agency-profile.constants.js';

import { validateFileMetadata } from '../../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

export async function getAgencyProfile(userId, { role = null } = {}) {
  if (role && role !== 'agency') {
    throw new ForbiddenError('Only agencies can access profile settings.', {
      code: AGENCY_PROFILE_ERROR_CODES.FORBIDDEN,
    });
  }

  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.', {
      code: AGENCY_PROFILE_ERROR_CODES.NOT_FOUND,
    });
  }

  return profile;
}

export async function getAgencyCoverageConfig(userId, { role = null } = {}) {
  if (role && role !== 'agency') {
    throw new ForbiddenError('Only agencies can access coverage configuration.', {
      code: AGENCY_PROFILE_ERROR_CODES.FORBIDDEN,
    });
  }

  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.', {
      code: AGENCY_PROFILE_ERROR_CODES.NOT_FOUND,
    });
  }

  const { destinations, regions } = await repository.getCanonicalDestinationsAndRegions();

  return {
    agencyId: profile.id,
    status: profile.status,
    userStatus: profile.user?.status,
    coverages: (profile.coverages || []).map((c) => ({
      id: c.id,
      locationName: c.locationName,
      destinationId: c.destinationId,
      regionId: c.regionId,
    })),
    capabilities: (profile.capabilities || []).map((c) => ({
      id: c.id,
      serviceType: c.serviceType,
      isEnabled: c.isEnabled,
    })),
    availableDestinations: destinations,
    availableRegions: regions,
  };
}

export async function updateAgencyCoverageConfig(userId, body, { role = null } = {}) {
  if (role && role !== 'agency') {
    throw new ForbiddenError('Only agencies can update coverage configuration.', {
      code: AGENCY_PROFILE_ERROR_CODES.FORBIDDEN,
    });
  }

  const validated = validateCoverageInput(body);

  let updatedProfile;
  await withTransaction(async (t) => {
    const profile = await repository.findAgencyProfileByUserId(userId, { transaction: t });
    if (!profile) {
      throw new NotFoundError('Agency profile not found.', {
        code: AGENCY_PROFILE_ERROR_CODES.NOT_FOUND,
      });
    }

    if (body.locations !== undefined) {
      await repository.replaceAgencyCoverages(profile.id, validated.locations, { transaction: t });
    }

    if (body.services !== undefined) {
      await repository.replaceAgencyCapabilities(profile.id, validated.services, {
        transaction: t,
      });
    }

    updatedProfile = await repository.findAgencyProfileByUserId(userId, { transaction: t });
  });

  return updatedProfile;
}

export async function getAgencyOnboardingStatus(userId) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }

  const documents = profile.documents || [];
  const verifiedDocs = documents.filter((d) => d.status === 'approved');
  const activeMembership = (profile.memberships || []).find((m) => m.status === 'active');
  const profileComplete = Boolean(profile.agencyName && (profile.phone || profile.contactPerson));

  return {
    agencyId: profile.id,
    agencyName: profile.agencyName,
    status: profile.status,
    profileComplete,
    agreementAccepted: Boolean(profile.agreementAccepted),
    agreementAcceptedAt: profile.agreementAcceptedAt,
    agreementVersion: profile.agreementVersion || 'v1.0',
    documentsCount: documents.length,
    verifiedDocumentsCount: verifiedDocs.length,
    hasActiveMembership: Boolean(activeMembership),
    isOperational:
      profile.status === 'approved' &&
      Boolean(profile.agreementAccepted) &&
      Boolean(activeMembership),
  };
}

export async function getAgencyDocuments(userId) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }
  return repository.findAgencyDocuments(profile.id);
}

export async function uploadAgencyDocument(userId, body = {}, meta = {}) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }

  const validTypes = new Set(['license', 'tax_certificate', 'identity', 'address_proof', 'other']);
  const documentType = body.documentType || body.type || 'license';
  if (!validTypes.has(documentType)) {
    throw new ValidationError(`Invalid document type: ${documentType}`);
  }

  const rawFilePath = meta.filePath || body.filePath || body.url || body.file || body.data;
  if (!rawFilePath) {
    throw new ValidationError('File path is required for document upload.');
  }

  let finalFilePath = rawFilePath;
  let originalName = meta.originalName || body.originalName || 'document';
  let mimeType = meta.mimeType || body.mimeType || 'application/pdf';
  let fileSize = meta.size || body.size || 0;

  // Handle base64 / data URL uploads
  if (typeof rawFilePath === 'string') {
    const isDataUrl = rawFilePath.startsWith('data:') || rawFilePath.includes(';base64,');
    const isBase64String =
      !rawFilePath.startsWith('/') &&
      !rawFilePath.startsWith('http://') &&
      !rawFilePath.startsWith('https://') &&
      rawFilePath.length > 255;

    if (isDataUrl || isBase64String) {
      try {
        let base64Data = rawFilePath;
        if (rawFilePath.includes(';base64,')) {
          const parts = rawFilePath.split(';base64,');
          if (parts[0].startsWith('data:')) {
            mimeType = parts[0].replace('data:', '') || mimeType;
          }
          base64Data = parts[1] || '';
        }
        const buffer = Buffer.from(base64Data, 'base64');
        fileSize = buffer.length;

        const fileMeta = validateFileMetadata({
          name: originalName,
          type: mimeType,
          size: buffer.length,
        });

        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.writeFile(fileMeta.destinationPath, buffer);

        finalFilePath = `/uploads/${path.basename(fileMeta.destinationPath)}`;
        originalName = fileMeta.originalName;
        mimeType = fileMeta.mimeType;
      } catch (err) {
        throw new ValidationError(err.message || 'Failed to process document upload.', {
          code: 'INVALID_FILE_UPLOAD',
        });
      }
    }
  }

  return repository.createAgencyDocument({
    agencyId: profile.id,
    documentType,
    filePath: finalFilePath,
    originalName,
    mimeType,
    fileSize,
    status: 'pending',
  });
}

export async function deleteAgencyDocument(userId, documentId) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }

  const doc = await repository.findAgencyDocumentById(documentId, profile.id);
  if (!doc) {
    throw new NotFoundError('Document not found.');
  }

  await repository.destroyAgencyDocument(documentId, profile.id);

  // Safely cleanup physical file if stored in local /uploads
  if (doc.filePath && doc.filePath.startsWith('/uploads/')) {
    try {
      const fileName = path.basename(doc.filePath);
      const fullPath = path.resolve(__dirname, '../../../uploads', fileName);
      await fs.unlink(fullPath);
    } catch {
      // ignore if file already missing
    }
  }

  return { success: true, message: 'Document removed.' };
}

export async function acceptMembershipAgreement(userId, { agreementVersion = 'v1.0' } = {}) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }

  await repository.updateAgreementAcceptance(profile.id, {
    agreementVersion,
    acceptedAt: new Date(),
  });

  return repository.findAgencyProfileByUserId(userId);
}

export async function submitAgencyOnboarding(userId) {
  const profile = await repository.findAgencyProfileByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Agency profile not found.');
  }

  if (!profile.agreementAccepted) {
    throw new ValidationError('Membership agreement must be accepted before submitting onboarding for review.');
  }

  const docs = profile.documents || [];
  if (docs.length === 0) {
    throw new ValidationError('At least one required document must be uploaded before submitting.');
  }

  return getAgencyOnboardingStatus(userId);
}
