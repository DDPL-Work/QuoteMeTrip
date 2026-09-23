/**
 * Centralized model registry (Phase 2).
 *
 * This is the ONLY place where models are initialized and associated.
 * Controllers, services, and routes must import models from here —
 * never call `initModel` or define associations elsewhere.
 *
 * Foreign-key behavior (documented decisions):
 * - User -> TravellerProfile / AgencyProfile: ON DELETE CASCADE.
 *   A profile is an existence-dependent extension of its user; it has
 *   no meaning once the user is removed.
 * - AgencyProfile -> AgencyDocuments / AgencyMemberships: ON DELETE
 *   CASCADE. Documents and memberships are owned records of the
 *   agency profile.
 * - MembershipPlan -> AgencyMemberships: ON DELETE RESTRICT. Plans
 *   referenced by membership history must not disappear; deactivate
 *   the plan instead of deleting it.
 * - AgencyDocument.verifiedBy -> User: ON DELETE SET NULL. The audit
 *   trail (who verified) survives administrator removal.
 * - All foreign keys: ON UPDATE CASCADE.
 */
import { getSequelize } from '../sequelize.js';
import { User } from './User.js';
import { TravellerProfile } from './TravellerProfile.js';
import { AgencyProfile } from './AgencyProfile.js';
import { AgencyDocument } from './AgencyDocument.js';
import { MembershipPlan } from './MembershipPlan.js';
import { AgencyMembership } from './AgencyMembership.js';

let registry = null;

export function initModels(sequelize = getSequelize()) {
  if (registry && registry.sequelize === sequelize) {
    return registry;
  }

  User.initModel(sequelize);
  TravellerProfile.initModel(sequelize);
  AgencyProfile.initModel(sequelize);
  AgencyDocument.initModel(sequelize);
  MembershipPlan.initModel(sequelize);
  AgencyMembership.initModel(sequelize);

  // User 1:1 TravellerProfile
  User.hasOne(TravellerProfile, {
    foreignKey: 'userId',
    as: 'travellerProfile',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  TravellerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User 1:1 AgencyProfile
  User.hasOne(AgencyProfile, {
    foreignKey: 'userId',
    as: 'agencyProfile',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AgencyProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AgencyProfile 1:N AgencyDocument
  AgencyProfile.hasMany(AgencyDocument, {
    foreignKey: 'agencyId',
    as: 'documents',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AgencyDocument.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // AgencyDocument N:1 User (verifier, nullable audit reference)
  User.hasMany(AgencyDocument, { foreignKey: 'verifiedBy', as: 'verifiedDocuments' });
  AgencyDocument.belongsTo(User, {
    foreignKey: 'verifiedBy',
    as: 'verifier',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // AgencyProfile 1:N AgencyMembership
  AgencyProfile.hasMany(AgencyMembership, {
    foreignKey: 'agencyId',
    as: 'memberships',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AgencyMembership.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // MembershipPlan 1:N AgencyMembership
  MembershipPlan.hasMany(AgencyMembership, {
    foreignKey: 'planId',
    as: 'memberships',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  AgencyMembership.belongsTo(MembershipPlan, { foreignKey: 'planId', as: 'plan' });

  registry = {
    sequelize,
    User,
    TravellerProfile,
    AgencyProfile,
    AgencyDocument,
    MembershipPlan,
    AgencyMembership,
  };

  return registry;
}

export { User, TravellerProfile, AgencyProfile, AgencyDocument, MembershipPlan, AgencyMembership };
