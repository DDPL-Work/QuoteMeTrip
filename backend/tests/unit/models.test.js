/**
 * Model definition tests (Phase 2).
 *
 * These tests need NO database connection: they verify model
 * attributes, constraints, and the centralized association wiring
 * on a throwaway Sequelize instance.
 */
import assert from 'node:assert';
import { describe, test, after } from 'node:test';
import { Sequelize } from 'sequelize';
import { initModels } from '../../src/db/models/index.js';

// Shared throwaway instance (never connected). Closed in after() so
// the connection-manager handles cannot keep the process alive.
const sequelize = new Sequelize('unused', 'unused', 'unused', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});
const registry = initModels(sequelize);

after(async () => {
  await sequelize.close();
});

function buildRegistry() {
  return registry;
}

describe('Phase 2 model definitions', () => {
  test('all six foundation models are registered', () => {
    const models = buildRegistry();
    for (const name of [
      'User',
      'TravellerProfile',
      'AgencyProfile',
      'AgencyDocument',
      'MembershipPlan',
      'AgencyMembership',
    ]) {
      assert.ok(models[name], `${name} should be registered`);
    }
  });

  test('User enforces email uniqueness and role/status defaults', () => {
    const { User } = buildRegistry();
    assert.strictEqual(User.rawAttributes.email.unique, true);
    assert.strictEqual(User.rawAttributes.email.allowNull, false);
    assert.strictEqual(User.rawAttributes.role.defaultValue, 'traveller');
    assert.strictEqual(User.rawAttributes.status.defaultValue, 'active');
  });

  test('profiles enforce one-to-one ownership via unique userId', () => {
    const { TravellerProfile, AgencyProfile } = buildRegistry();
    assert.strictEqual(TravellerProfile.rawAttributes.userId.unique, true);
    assert.strictEqual(AgencyProfile.rawAttributes.userId.unique, true);
  });

  test('User hasOne TravellerProfile and AgencyProfile', () => {
    const { User, TravellerProfile, AgencyProfile } = buildRegistry();
    assert.strictEqual(User.associations.travellerProfile.target, TravellerProfile);
    assert.strictEqual(User.associations.travellerProfile.foreignKey, 'userId');
    assert.strictEqual(User.associations.agencyProfile.target, AgencyProfile);
    assert.strictEqual(User.associations.agencyProfile.foreignKey, 'userId');
  });

  test('AgencyProfile hasMany documents and memberships', () => {
    const { AgencyProfile, AgencyDocument, AgencyMembership } = buildRegistry();
    assert.strictEqual(AgencyProfile.associations.documents.target, AgencyDocument);
    assert.strictEqual(AgencyProfile.associations.memberships.target, AgencyMembership);
  });

  test('AgencyMembership belongsTo agency and plan', () => {
    const { AgencyMembership, AgencyProfile, MembershipPlan } = buildRegistry();
    assert.strictEqual(AgencyMembership.associations.agency.target, AgencyProfile);
    assert.strictEqual(AgencyMembership.associations.plan.target, MembershipPlan);
  });

  test('MembershipPlan hasMany memberships', () => {
    const { MembershipPlan, AgencyMembership } = buildRegistry();
    assert.strictEqual(MembershipPlan.associations.memberships.target, AgencyMembership);
  });

  test('tables use snake_case plural names', () => {
    const models = buildRegistry();
    assert.strictEqual(models.User.getTableName(), 'users');
    assert.strictEqual(models.TravellerProfile.getTableName(), 'traveller_profiles');
    assert.strictEqual(models.AgencyProfile.getTableName(), 'agency_profiles');
    assert.strictEqual(models.AgencyDocument.getTableName(), 'agency_documents');
    assert.strictEqual(models.MembershipPlan.getTableName(), 'membership_plans');
    assert.strictEqual(models.AgencyMembership.getTableName(), 'agency_memberships');
  });
});
