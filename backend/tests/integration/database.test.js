/**
 * Database integration tests (Phase 2).
 *
 * Run against the ISOLATED test database only (NODE_ENV=test resolves
 * to `DB_TEST_NAME`). Prepare it first:
 *
 *   npm run db:test:prepare --workspace=@troublefree/backend
 *
 * These tests fail loudly when MySQL is unreachable — they are never
 * silently skipped.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';
import { withTransaction } from '../../src/db/transaction.js';

const suffix = Date.now().toString(36);
const email = (name) => `${name}+${suffix}@example.com`;

let db;
let models;

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for integration tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  models = initModels(db);
  await migrateUp(db);
});

after(async () => {
  await closeDatabase();
  resetSequelizeInstance();
});

describe('Phase 2 database integration', () => {
  test('creates a user with a traveller profile', async () => {
    const user = await models.User.create({
      name: 'Test Traveller',
      email: email('traveller'),
      role: 'traveller',
    });
    await models.TravellerProfile.create({
      userId: user.id,
      firstName: 'Test',
      lastName: 'Traveller',
      preferredLocale: 'tr',
    });

    const found = await models.User.findByPk(user.id, {
      include: [{ model: models.TravellerProfile, as: 'travellerProfile' }],
    });
    assert.strictEqual(found.travellerProfile.firstName, 'Test');
    assert.strictEqual(found.travellerProfile.preferredLocale, 'tr');
  });

  test('rejects duplicate user emails', async () => {
    const duplicate = email('dupe');
    await models.User.create({ name: 'First', email: duplicate, role: 'traveller' });
    await assert.rejects(
      models.User.create({ name: 'Second', email: duplicate, role: 'agency' }),
      /unique|duplicate/i,
    );
  });

  test('rejects profiles for unknown users (foreign key)', async () => {
    await assert.rejects(
      models.TravellerProfile.create({ userId: 999999999, firstName: 'Ghost' }),
      /foreign key|constraint|a foreign key constraint fails/i,
    );
  });

  test('rejects a second traveller profile for the same user (1:1)', async () => {
    const user = await models.User.create({
      name: 'Solo',
      email: email('solo'),
      role: 'traveller',
    });
    await models.TravellerProfile.create({ userId: user.id });
    await assert.rejects(models.TravellerProfile.create({ userId: user.id }), /unique|duplicate/i);
  });

  test('creates agency graph inside a transaction', async () => {
    const tag = email('agency');
    const plan = await models.MembershipPlan.create({
      name: `Plan ${suffix}`,
      slug: `plan-${suffix}`,
      price: 10,
      currency: 'USD',
      durationDays: 30,
    });

    let agencyId;
    await withTransaction(async (t) => {
      const user = await models.User.create(
        { name: 'Agency Owner', email: tag, role: 'agency' },
        { transaction: t },
      );
      const agency = await models.AgencyProfile.create(
        { userId: user.id, agencyName: 'Test Agency', status: 'approved' },
        { transaction: t },
      );
      agencyId = agency.id;
      await models.AgencyDocument.create(
        { agencyId: agency.id, documentType: 'license', filePath: '/uploads/license.pdf' },
        { transaction: t },
      );
      await models.AgencyMembership.create(
        { agencyId: agency.id, planId: plan.id, startsAt: new Date() },
        { transaction: t },
      );
    });

    const agency = await models.AgencyProfile.findByPk(agencyId, {
      include: [
        { model: models.AgencyDocument, as: 'documents' },
        {
          model: models.AgencyMembership,
          as: 'memberships',
          include: [{ model: models.MembershipPlan, as: 'plan' }],
        },
      ],
    });
    assert.ok(agency.documents.length >= 1);
    assert.ok(agency.memberships.length >= 1);
    assert.strictEqual(agency.memberships[0].plan.slug, `plan-${suffix}`);
  });

  test('rolls back the whole transaction on error', async () => {
    const tag = email('rollback');
    await assert.rejects(
      withTransaction(async (t) => {
        await models.User.create(
          { name: 'Doomed', email: tag, role: 'traveller' },
          { transaction: t },
        );
        throw new Error('boom');
      }),
      /boom/,
    );
    const found = await models.User.findOne({ where: { email: tag } });
    assert.strictEqual(found, null);
  });

  test('RESTRICT: cannot delete a plan with memberships', async () => {
    const user = await models.User.create({
      name: 'Plan Guard',
      email: email('guard'),
      role: 'agency',
    });
    const agency = await models.AgencyProfile.create({
      userId: user.id,
      agencyName: 'Guard Agency',
    });
    const plan = await models.MembershipPlan.create({
      name: `Guarded ${suffix}`,
      slug: `guarded-${suffix}`,
      price: 5,
      currency: 'USD',
      durationDays: 30,
    });
    await models.AgencyMembership.create({
      agencyId: agency.id,
      planId: plan.id,
      startsAt: new Date(),
    });

    await assert.rejects(plan.destroy(), /restrict|foreign key|a foreign key constraint fails/i);
  });

  test('CASCADE: deleting a user removes its profiles', async () => {
    const user = await models.User.create({
      name: 'Ephemeral',
      email: email('ephemeral'),
      role: 'traveller',
    });
    await models.TravellerProfile.create({ userId: user.id });
    await user.destroy();
    const profile = await models.TravellerProfile.findOne({ where: { userId: user.id } });
    assert.strictEqual(profile, null);
  });

  test('SET NULL: deleting a verifier keeps the document', async () => {
    const admin = await models.User.create({
      name: 'Verifier',
      email: email('verifier'),
      role: 'admin',
    });
    const owner = await models.User.create({
      name: 'Doc Owner',
      email: email('docowner'),
      role: 'agency',
    });
    const agency = await models.AgencyProfile.create({
      userId: owner.id,
      agencyName: 'Doc Agency',
    });
    const doc = await models.AgencyDocument.create({
      agencyId: agency.id,
      documentType: 'identity',
      filePath: '/uploads/id.pdf',
      status: 'approved',
      verifiedBy: admin.id,
      verifiedAt: new Date(),
    });

    await admin.destroy();
    await doc.reload();
    assert.strictEqual(doc.verifiedBy, null);
    assert.strictEqual(doc.status, 'approved');
  });
});
