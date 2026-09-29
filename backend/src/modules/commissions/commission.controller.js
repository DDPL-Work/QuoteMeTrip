import * as service from './commission.service.js';

export async function getCommissions(req, res, next) {
  try {
    const result = await service.listCommissions(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCommissionSummary(req, res, next) {
  try {
    const summary = await service.getCommissionSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function getCommission(req, res, next) {
  try {
    const commission = await service.getCommissionById(req.params.id);
    res.json({ success: true, data: commission });
  } catch (err) {
    next(err);
  }
}

export async function updateCommissionStatus(req, res, next) {
  try {
    const commission = await service.updateCommissionStatus(req.params.id, req.body, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: commission });
  } catch (err) {
    next(err);
  }
}
