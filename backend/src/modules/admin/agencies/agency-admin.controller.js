import * as service from './agency-admin.service.js';

export async function getAgencies(req, res, next) {
  try {
    const result = await service.listAgencies(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAgency(req, res, next) {
  try {
    const agency = await service.getAgencyById(req.params.id);
    res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
}

export async function approveAgency(req, res, next) {
  try {
    const agency = await service.approveAgency(req.params.id, req.user.id, { ip: req.ip });
    res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
}

export async function rejectAgency(req, res, next) {
  try {
    const { reason } = req.body || {};
    const agency = await service.rejectAgency(req.params.id, reason, req.user.id, { ip: req.ip });
    res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
}

export async function suspendAgency(req, res, next) {
  try {
    const { reason } = req.body || {};
    const agency = await service.suspendAgency(req.params.id, reason, req.user.id, { ip: req.ip });
    res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
}

export async function reactivateAgency(req, res, next) {
  try {
    const agency = await service.reactivateAgency(req.params.id, req.user.id, { ip: req.ip });
    res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
}

export async function verifyDocument(req, res, next) {
  try {
    const doc = await service.verifyDocument(req.params.id, req.params.documentId, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function rejectDocument(req, res, next) {
  try {
    const { note } = req.body || {};
    const doc = await service.rejectDocument(
      req.params.id,
      req.params.documentId,
      note,
      req.user.id,
      { ip: req.ip },
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}
