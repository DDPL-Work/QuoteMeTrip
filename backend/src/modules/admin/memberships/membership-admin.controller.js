import * as service from './membership-admin.service.js';

export async function getMembershipPlans(req, res, next) {
  try {
    const plans = await service.listMembershipPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
}

export async function createMembershipPlan(req, res, next) {
  try {
    const plan = await service.createMembershipPlan(req.body, req.user.id, { ip: req.ip });
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

export async function updateMembershipPlan(req, res, next) {
  try {
    const plan = await service.updateMembershipPlan(req.params.id, req.body, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

export async function deleteMembershipPlan(req, res, next) {
  try {
    await service.deleteMembershipPlan(req.params.id, req.user.id, { ip: req.ip });
    res.json({ success: true, message: 'Membership plan deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getMemberships(req, res, next) {
  try {
    const result = await service.listMemberships(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMembership(req, res, next) {
  try {
    const membership = await service.getMembershipById(req.params.id);
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}

export async function createAgencyMembership(req, res, next) {
  try {
    const { planId, ...rest } = req.body;
    const membership = await service.createAgencyMembership(
      req.params.agencyId,
      planId,
      rest,
      req.user.id,
      { ip: req.ip },
    );
    res.status(201).json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}

export async function confirmPayment(req, res, next) {
  try {
    const membership = await service.confirmPayment(req.params.id, req.body, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}

export async function suspendMembership(req, res, next) {
  try {
    const membership = await service.suspendMembership(req.params.id, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}

export async function reactivateMembership(req, res, next) {
  try {
    const membership = await service.reactivateMembership(req.params.id, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}

export async function updateMembership(req, res, next) {
  try {
    const membership = await service.updateMembership(req.params.id, req.body, req.user.id, {
      ip: req.ip,
    });
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
}
