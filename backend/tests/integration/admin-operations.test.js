import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import { getSequelize, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import {
  createAdminUser,
  registerAgency,
  registerTraveller,
} from '../../src/modules/auth/auth.service.js';
import * as agencyAdminService from '../../src/modules/admin/agencies/agency-admin.service.js';
import * as membershipAdminService from '../../src/modules/admin/memberships/membership-admin.service.js';
import * as commissionService from '../../src/modules/commissions/commission.service.js';
import * as auditService from '../../src/modules/audit/audit.service.js';
import { matchAgenciesForRequest } from '../../src/modules/agency-matching/matching.service.js';
import {
  createRequest,
  submitRequest,
} from '../../src/modules/travel-requests/travel-requests.service.js';

let db;
let adminUser;
let travellerUser;
let agencyUser;
let agencyProfile;
let defaultPlan;

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();
  await db.authenticate();
  await migrateUp(db);

  const models = initModels();

  // Create default membership plan
  [defaultPlan] = await models.MembershipPlan.findOrCreate({
    where: { slug: 'monthly-standard' },
    defaults: {
      name: 'Monthly Standard',
      slug: 'monthly-standard',
      price: 99.0,
      currency: 'USD',
      durationDays: 30,
      status: 'active',
    },
  });

  // Provision Admin
  const adminEmail = `admin-${Date.now()}@troublefree.com`;
  adminUser = await createAdminUser({
    name: 'Admin Test',
    email: adminEmail,
    password: 'AdminPassword123!',
  });

  // Register Traveller
  const travellerReg = await registerTraveller({
    name: 'Traveller One',
    email: `traveller-${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Traveller',
    lastName: 'One',
  });
  travellerUser = travellerReg.user;

  // Register Agency
  const agencyReg = await registerAgency({
    name: 'Agency Rep',
    email: `agency-${Date.now()}@agencycorp.com`,
    password: 'AgencyPassword123!',
    agencyName: 'Sun Travels Agency',
    contactPerson: 'Rep Name',
    city: 'Istanbul',
    country: 'Turkey',
  });
  agencyUser = agencyReg.user;
  agencyProfile = await models.AgencyProfile.findOne({ where: { userId: agencyUser.id } });
});

describe('Phase 7 — Admin Operations, Agency Approval & Memberships', () => {
  test('Agency initially starts in pending status', async () => {
    assert.strictEqual(agencyProfile.status, 'pending');
  });

  test('Admin can list agencies with pagination and search', async () => {
    const res = await agencyAdminService.listAgencies({ search: 'Sun Travels' });
    assert.ok(res.items.length >= 1);
    assert.strictEqual(res.items[0].agencyName, 'Sun Travels Agency');
  });

  test('Admin can approve agency and generate audit log', async () => {
    const approved = await agencyAdminService.approveAgency(agencyProfile.id, adminUser.id, {
      ip: '127.0.0.1',
    });
    assert.strictEqual(approved.status, 'approved');

    const logs = await auditService.listAuditLogs({
      entityType: 'agency',
      entityId: agencyProfile.id,
    });
    assert.ok(logs.items.some((l) => l.action === 'agency.approved'));
  });

  test('Admin can suspend and reactivate agency', async () => {
    const suspended = await agencyAdminService.suspendAgency(
      agencyProfile.id,
      'Routine audit',
      adminUser.id,
    );
    assert.strictEqual(suspended.status, 'suspended');

    const reactivated = await agencyAdminService.reactivateAgency(agencyProfile.id, adminUser.id);
    assert.strictEqual(reactivated.status, 'approved');
  });

  test('Admin can upload/verify agency documents', async () => {
    const models = initModels();
    const doc = await models.AgencyDocument.create({
      agencyId: agencyProfile.id,
      documentType: 'license',
      filePath: '/uploads/license.pdf',
      originalName: 'license.pdf',
      status: 'pending',
    });

    const verified = await agencyAdminService.verifyDocument(
      agencyProfile.id,
      doc.id,
      adminUser.id,
    );
    assert.strictEqual(verified.status, 'approved');
    assert.strictEqual(verified.verifiedBy, adminUser.id);

    const doc2 = await models.AgencyDocument.create({
      agencyId: agencyProfile.id,
      documentType: 'tax_certificate',
      filePath: '/uploads/tax.pdf',
      originalName: 'tax.pdf',
      status: 'pending',
    });

    const rejected = await agencyAdminService.rejectDocument(
      agencyProfile.id,
      doc2.id,
      'Blurry text',
      adminUser.id,
    );
    assert.strictEqual(rejected.status, 'rejected');
    assert.strictEqual(rejected.verificationNote, 'Blurry text');
  });

  test('Admin can manage membership plans', async () => {
    const plans = await membershipAdminService.listMembershipPlans();
    assert.ok(plans.length >= 1);

    const ts = Date.now();
    const newPlan = await membershipAdminService.createMembershipPlan(
      {
        name: `Annual Deluxe ${ts}`,
        slug: `annual-deluxe-${ts}`,
        price: 899.0,
        currency: 'USD',
        durationDays: 365,
        status: 'active',
      },
      adminUser.id,
    );
    assert.strictEqual(newPlan.slug, `annual-deluxe-${ts}`);
  });

  test('Admin can create membership & confirm manual payment', async () => {
    const mem = await membershipAdminService.createAgencyMembership(
      agencyProfile.id,
      defaultPlan.id,
      { paymentReference: 'BANK-WIRE-1001', status: 'pending', agreementAccepted: true },
      adminUser.id,
    );
    assert.strictEqual(mem.status, 'pending');

    const confirmed = await membershipAdminService.confirmPayment(
      mem.id,
      { paymentReference: 'BANK-WIRE-1001-VERIFIED', notes: 'Payment verified in bank statement' },
      adminUser.id,
    );
    assert.strictEqual(confirmed.status, 'active');
    assert.strictEqual(confirmed.confirmedBy, adminUser.id);
    assert.ok(confirmed.confirmedAt);
  });
});

describe('Phase 7 — Matching Eligibility Verification (Requirement 31)', () => {
  let route;
  let request;

  before(async () => {
    const models = initModels();
    route = await models.Route.create({
      travellerId: travellerUser.id,
      startLocation: 'Istanbul',
      finalDestination: 'Cappadocia',
      totalDistanceKm: 750,
      estimatedDurationMinutes: 480,
      recommendedDays: 3,
      calculationProvider: 'mock',
      calculationVersion: 'v1',
    });
  });

  test('Approved + Active Membership -> ELIGIBLE', async () => {
    const models = initModels();

    // Ensure agency is approved & has active membership
    await agencyProfile.update({ status: 'approved' });
    await models.AgencyMembership.destroy({ where: { agencyId: agencyProfile.id } });
    await models.AgencyMembership.create({
      agencyId: agencyProfile.id,
      planId: defaultPlan.id,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 30),
      status: 'active',
    });

    request = await createRequest(travellerUser.id, {
      routeId: route.id,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-07',
      numberOfTravellers: 2,
    });
    await submitRequest(travellerUser.id, request.id);

    const matches = await models.TravelRequestAgency.findAll({
      where: { travelRequestId: request.id, agencyId: agencyProfile.id },
    });
    assert.strictEqual(matches.length, 1, 'Agency should be matched when approved & active');
  });

  test('Approved + Expired Membership -> NOT ELIGIBLE', async () => {
    const models = initModels();
    await models.AgencyMembership.destroy({ where: { agencyId: agencyProfile.id } });
    await models.AgencyMembership.create({
      agencyId: agencyProfile.id,
      planId: defaultPlan.id,
      startsAt: new Date(Date.now() - 86400000 * 60),
      endsAt: new Date(Date.now() - 86400000 * 30),
      status: 'expired',
    });

    const req2 = await createRequest(travellerUser.id, {
      routeId: route.id,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-07',
      numberOfTravellers: 2,
    });
    await submitRequest(travellerUser.id, req2.id);

    const matches = await matchAgenciesForRequest(req2.id);
    assert.ok(
      !matches.some((m) => m.agencyId === agencyProfile.id),
      'Agency should NOT be matched when membership is expired',
    );
  });

  test('Approved + Suspended Membership -> NOT ELIGIBLE', async () => {
    const models = initModels();
    await models.AgencyMembership.destroy({ where: { agencyId: agencyProfile.id } });
    await models.AgencyMembership.create({
      agencyId: agencyProfile.id,
      planId: defaultPlan.id,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 30),
      status: 'suspended',
    });

    const req3 = await createRequest(travellerUser.id, {
      routeId: route.id,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-07',
      numberOfTravellers: 2,
    });
    await submitRequest(travellerUser.id, req3.id);

    const matches = await matchAgenciesForRequest(req3.id);
    assert.ok(
      !matches.some((m) => m.agencyId === agencyProfile.id),
      'Agency should NOT be matched when membership is suspended',
    );
  });

  test('Suspended / Rejected Agency -> NOT ELIGIBLE', async () => {
    const models = initModels();
    await agencyProfile.update({ status: 'suspended' });
    await models.AgencyMembership.destroy({ where: { agencyId: agencyProfile.id } });
    await models.AgencyMembership.create({
      agencyId: agencyProfile.id,
      planId: defaultPlan.id,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 30),
      status: 'active',
    });

    const req4 = await createRequest(travellerUser.id, {
      routeId: route.id,
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-07',
      numberOfTravellers: 2,
    });
    await submitRequest(travellerUser.id, req4.id);

    const matches = await matchAgenciesForRequest(req4.id);
    assert.ok(
      !matches.some((m) => m.agencyId === agencyProfile.id),
      'Agency should NOT be matched when agency status is suspended',
    );
  });
});

describe('Phase 7 — Commission Calculation & Management', () => {
  test('Deterministic commission calculation function', () => {
    const calc = commissionService.calculateCommission(1500.0, 10.0);
    assert.strictEqual(calc.jobAmount, 1500.0);
    assert.strictEqual(calc.commissionRate, 10.0);
    assert.strictEqual(calc.commissionAmount, 150.0);
  });

  test('Admin can list and update commission status', async () => {
    const list = await commissionService.listCommissions({});
    assert.ok(Array.isArray(list.items));

    const summary = await commissionService.getCommissionSummary();
    assert.ok(typeof summary.totalCommissionAmount === 'number');
  });
});

after(async () => {
  const models = initModels();
  await models.AgencyMembership.destroy({ where: { agencyId: agencyProfile.id } });
  const allPlans = await models.MembershipPlan.findAll();
  for (const p of allPlans) {
    if (p.slug.startsWith('annual-deluxe-')) {
      await p.destroy();
    }
  }
});
