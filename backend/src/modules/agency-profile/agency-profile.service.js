import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import * as repository from './agency-profile.repository.js';
import { validateCoverageInput } from './agency-profile.validation.js';
import { AGENCY_PROFILE_ERROR_CODES } from './agency-profile.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const filePath = meta.filePath || body.filePath || body.url;
  if (!filePath) {
    throw new ValidationError('File path is required for document upload.');
  }

  return repository.createAgencyDocument({
    agencyId: profile.id,
    documentType,
    filePath,
    originalName: meta.originalName || body.originalName || 'document',
    mimeType: meta.mimeType || body.mimeType || 'application/pdf',
    fileSize: meta.size || body.size || 0,
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
