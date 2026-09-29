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
    assert.strictEqual(
      Boolean(User.rawAttributes.email.unique || User.rawAttributes.email._uniqueAttribute),
      true,
    );
    assert.strictEqual(User.rawAttributes.email.allowNull, false);
    assert.strictEqual(User.rawAttributes.role.defaultValue, 'traveller');
    assert.strictEqual(User.rawAttributes.status.defaultValue, 'active');
  });

  test('profiles enforce one-to-one ownership via unique userId', () => {
    const { TravellerProfile, AgencyProfile } = buildRegistry();
    assert.strictEqual(
      Boolean(
        TravellerProfile.rawAttributes.userId.unique ||
        TravellerProfile.rawAttributes.userId._uniqueAttribute,
      ),
      true,
    );
    assert.strictEqual(
      Boolean(
        AgencyProfile.rawAttributes.userId.unique ||
        AgencyProfile.rawAttributes.userId._uniqueAttribute,
      ),
      true,
    );
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

  test('Phase 4 models are registered', () => {
    const models = buildRegistry();
    for (const name of ['Route', 'RouteStop', 'TravelRequest', 'TravelRequestDay']) {
      assert.ok(models[name], `${name} should be registered`);
    }
  });

  test('Phase 4 tables use snake_case plural names', () => {
    const models = buildRegistry();
    assert.strictEqual(models.Route.getTableName(), 'routes');
    assert.strictEqual(models.RouteStop.getTableName(), 'route_stops');
    assert.strictEqual(models.TravelRequest.getTableName(), 'travel_requests');
    assert.strictEqual(models.TravelRequestDay.getTableName(), 'travel_request_days');
  });

  test('User hasMany routes and travel requests', () => {
    const { User, Route, TravelRequest } = buildRegistry();
    assert.strictEqual(User.associations.routes.target, Route);
    assert.strictEqual(User.associations.routes.foreignKey, 'travellerId');
    assert.strictEqual(User.associations.travelRequests.target, TravelRequest);
    assert.strictEqual(User.associations.travelRequests.foreignKey, 'travellerId');
  });

  test('Route hasMany stops and travel requests', () => {
    const { Route, RouteStop, TravelRequest } = buildRegistry();
    assert.strictEqual(Route.associations.stops.target, RouteStop);
    assert.strictEqual(Route.associations.travelRequests.target, TravelRequest);
  });

  test('TravelRequest hasMany days and belongsTo route', () => {
    const { TravelRequest, TravelRequestDay, Route } = buildRegistry();
    assert.strictEqual(TravelRequest.associations.days.target, TravelRequestDay);
    assert.strictEqual(TravelRequest.associations.route.target, Route);
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

  test('Phase 5 models are registered', () => {
    const models = buildRegistry();
    for (const name of ['TravelRequestAgency', 'Quotation', 'QuotationItem']) {
      assert.ok(models[name], `${name} should be registered`);
    }
  });

  test('Phase 5 tables use snake_case plural names', () => {
    const models = buildRegistry();
    assert.strictEqual(models.TravelRequestAgency.getTableName(), 'travel_request_agencies');
    assert.strictEqual(models.Quotation.getTableName(), 'quotations');
    assert.strictEqual(models.QuotationItem.getTableName(), 'quotation_items');
  });

  test('TravelRequest hasMany agencyMatches; AgencyProfile hasMany requestMatches', () => {
    const { TravelRequest, AgencyProfile, TravelRequestAgency } = buildRegistry();
    assert.strictEqual(TravelRequest.associations.agencyMatches.target, TravelRequestAgency);
    assert.strictEqual(TravelRequest.associations.agencyMatches.foreignKey, 'travelRequestId');
    assert.strictEqual(AgencyProfile.associations.requestMatches.target, TravelRequestAgency);
    assert.strictEqual(AgencyProfile.associations.requestMatches.foreignKey, 'agencyId');
    assert.strictEqual(TravelRequestAgency.associations.travelRequest.target, TravelRequest);
    assert.strictEqual(TravelRequestAgency.associations.agency.target, AgencyProfile);
  });

  test('TravelRequest and AgencyProfile haveMany quotations', () => {
    const { TravelRequest, AgencyProfile, Quotation } = buildRegistry();
    assert.strictEqual(TravelRequest.associations.quotations.target, Quotation);
    assert.strictEqual(TravelRequest.associations.quotations.foreignKey, 'travelRequestId');
    assert.strictEqual(AgencyProfile.associations.quotations.target, Quotation);
    assert.strictEqual(AgencyProfile.associations.quotations.foreignKey, 'agencyId');
    assert.strictEqual(Quotation.associations.travelRequest.target, TravelRequest);
    assert.strictEqual(Quotation.associations.agency.target, AgencyProfile);
  });

  test('Quotation hasMany items; QuotationItem belongsTo quotation', () => {
    const { Quotation, QuotationItem } = buildRegistry();
    assert.strictEqual(Quotation.associations.items.target, QuotationItem);
    assert.strictEqual(Quotation.associations.items.foreignKey, 'quotationId');
    assert.strictEqual(QuotationItem.associations.quotation.target, Quotation);
  });

  test('Phase 6 models are registered', () => {
    const models = buildRegistry();
    for (const name of ['Conversation', 'Message', 'Job']) {
      assert.ok(models[name], `${name} should be registered`);
    }
  });

  test('Phase 6 tables use snake_case plural names', () => {
    const models = buildRegistry();
    assert.strictEqual(models.Conversation.getTableName(), 'conversations');
    assert.strictEqual(models.Message.getTableName(), 'messages');
    assert.strictEqual(models.Job.getTableName(), 'jobs');
  });

  test('TravelRequest hasMany conversations and jobs; Quotation hasMany jobs', () => {
    const { TravelRequest, Conversation, Job, Quotation } = buildRegistry();
    assert.strictEqual(TravelRequest.associations.conversations.target, Conversation);
    assert.strictEqual(TravelRequest.associations.conversations.foreignKey, 'travelRequestId');
    assert.strictEqual(Conversation.associations.travelRequest.target, TravelRequest);
    assert.strictEqual(TravelRequest.associations.jobs.target, Job);
    assert.strictEqual(TravelRequest.associations.jobs.foreignKey, 'travelRequestId');
    assert.strictEqual(Job.associations.travelRequest.target, TravelRequest);
    assert.strictEqual(Quotation.associations.jobs.target, Job);
    assert.strictEqual(Quotation.associations.jobs.foreignKey, 'quotationId');
    assert.strictEqual(Job.associations.quotation.target, Quotation);
  });

  test('User and AgencyProfile own conversations and jobs; Conversation hasMany messages', () => {
    const { User, AgencyProfile, Conversation, Message, Job } = buildRegistry();
    assert.strictEqual(User.associations.travellerConversations.target, Conversation);
    assert.strictEqual(User.associations.travellerConversations.foreignKey, 'travellerId');
    assert.strictEqual(Conversation.associations.traveller.target, User);
    assert.strictEqual(AgencyProfile.associations.conversations.target, Conversation);
    assert.strictEqual(AgencyProfile.associations.conversations.foreignKey, 'agencyId');
    assert.strictEqual(Conversation.associations.agency.target, AgencyProfile);
    assert.strictEqual(Conversation.associations.messages.target, Message);
    assert.strictEqual(Conversation.associations.messages.foreignKey, 'conversationId');
    assert.strictEqual(Message.associations.conversation.target, Conversation);
    assert.strictEqual(User.associations.sentMessages.target, Message);
    assert.strictEqual(Message.associations.sender.target, User);
    assert.strictEqual(User.associations.travellerJobs.target, Job);
    assert.strictEqual(Job.associations.traveller.target, User);
    assert.strictEqual(AgencyProfile.associations.jobs.target, Job);
    assert.strictEqual(Job.associations.agency.target, AgencyProfile);
  });
});
