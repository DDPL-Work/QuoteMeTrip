import * as service from './admin-operational.service.js';

export async function getDashboardMetrics(req, res, next) {
  try {
    const metrics = await service.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

export async function getTravelRequests(req, res, next) {
  try {
    const result = await service.listAdminTravelRequests(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getTravelRequest(req, res, next) {
  try {
    const request = await service.getAdminTravelRequestById(req.params.id);
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function getJobs(req, res, next) {
  try {
    const result = await service.listAdminJobs(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getJob(req, res, next) {
  try {
    const job = await service.getAdminJobById(req.params.id);
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}
