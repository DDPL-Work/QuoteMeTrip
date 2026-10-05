import * as service from './agency-profile.service.js';
import { validateFileMetadata } from '../../middleware/upload.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await service.getAgencyProfile(req.user.id, { role: req.user.role });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getCoverage(req, res, next) {
  try {
    const config = await service.getAgencyCoverageConfig(req.user.id, { role: req.user.role });
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateCoverage(req, res, next) {
  try {
    const profile = await service.updateAgencyCoverageConfig(req.user.id, req.body, {
      role: req.user.role,
    });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getOnboardingStatus(req, res, next) {
  try {
    const status = await service.getAgencyOnboardingStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req, res, next) {
  try {
    const documents = await service.getAgencyDocuments(req.user.id);
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    let meta = {};
    if (req.file) {
      meta = validateFileMetadata(req.file);
    }
    const doc = await service.uploadAgencyDocument(req.user.id, req.body, meta);
    res.status(201).json({ success: true, data: doc, message: 'Document uploaded successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const result = await service.deleteAgencyDocument(req.user.id, req.params.documentId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function acceptAgreement(req, res, next) {
  try {
    const profile = await service.acceptMembershipAgreement(req.user.id, req.body || {});
    res.json({ success: true, data: profile, message: 'Membership agreement accepted.' });
  } catch (error) {
    next(error);
  }
}

export async function submitOnboarding(req, res, next) {
  try {
    const status = await service.submitAgencyOnboarding(req.user.id);
    res.json({ success: true, data: status, message: 'Onboarding submitted for admin review.' });
  } catch (error) {
    next(error);
  }
}
