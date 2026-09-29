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
 * - User -> AuthSession / AuthIdentity: ON DELETE CASCADE. Sessions
 *   and provider links are meaningless without the user.
 * - TravelRequest -> TravelRequestAgency / Quotation: ON DELETE
 *   CASCADE. Matches and quotations die with the request.
 * - AgencyProfile -> TravelRequestAgency / Quotation: ON DELETE
 *   CASCADE. Matches and quotations die with the agency.
 * - Quotation -> QuotationItem: ON DELETE CASCADE. Items are
 *   existence-dependent lines of their quotation.
 * - TravelRequest -> Conversation / Job: ON DELETE CASCADE. Threads
 *   and jobs die with the request.
 * - User -> Conversation (traveller) / Job (traveller): ON DELETE
 *   CASCADE.
 * - AgencyProfile -> Conversation / Job: ON DELETE CASCADE.
 * - Conversation -> Message: ON DELETE CASCADE. Lines die with the
 *   thread.
 * - Message.senderUserId -> User: ON DELETE SET NULL. The thread
 *   stays readable if a user is removed.
 * - Quotation -> Job: ON DELETE RESTRICT. The accepted quotation
 *   cannot disappear under a live job.
 * - All foreign keys: ON UPDATE CASCADE.
 */
import { getSequelize } from '../sequelize.js';
import { User } from './User.js';
import { TravellerProfile } from './TravellerProfile.js';
import { AgencyProfile } from './AgencyProfile.js';
import { AgencyDocument } from './AgencyDocument.js';
import { MembershipPlan } from './MembershipPlan.js';
import { AgencyMembership } from './AgencyMembership.js';
import { AuthSession } from './AuthSession.js';
import { AuthIdentity } from './AuthIdentity.js';
import { Route } from './Route.js';
import { RouteStop } from './RouteStop.js';
import { TravelRequest } from './TravelRequest.js';
import { TravelRequestDay } from './TravelRequestDay.js';
import { TravelRequestAgency } from './TravelRequestAgency.js';
import { Quotation } from './Quotation.js';
import { QuotationItem } from './QuotationItem.js';
import { Conversation } from './Conversation.js';
import { Message } from './Message.js';
import { Job } from './Job.js';
import { Commission } from './Commission.js';
import { AuditLog } from './AuditLog.js';
import { Notification } from './Notification.js';
import { PushToken } from './PushToken.js';
import { WeatherCache } from './WeatherCache.js';
import { TravelGuideRegion } from './TravelGuideRegion.js';
import { TravelGuideDestination } from './TravelGuideDestination.js';
import { TravelGuideArticle } from './TravelGuideArticle.js';
import { Rating } from './Rating.js';

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
  AuthSession.initModel(sequelize);
  AuthIdentity.initModel(sequelize);
  Route.initModel(sequelize);
  RouteStop.initModel(sequelize);
  TravelRequest.initModel(sequelize);
  TravelRequestDay.initModel(sequelize);
  TravelRequestAgency.initModel(sequelize);
  Quotation.initModel(sequelize);
  QuotationItem.initModel(sequelize);
  Conversation.initModel(sequelize);
  Message.initModel(sequelize);
  Job.initModel(sequelize);
  Commission.initModel(sequelize);
  AuditLog.initModel(sequelize);
  Notification.initModel(sequelize);
  PushToken.initModel(sequelize);
  WeatherCache.initModel(sequelize);
  TravelGuideRegion.initModel(sequelize);
  TravelGuideDestination.initModel(sequelize);
  TravelGuideArticle.initModel(sequelize);
  Rating.initModel(sequelize);

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

  // AgencyMembership N:1 User (confirmer)
  AgencyMembership.belongsTo(User, {
    foreignKey: 'confirmedBy',
    as: 'confirmer',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // MembershipPlan 1:N AgencyMembership
  MembershipPlan.hasMany(AgencyMembership, {
    foreignKey: 'planId',
    as: 'memberships',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  AgencyMembership.belongsTo(MembershipPlan, { foreignKey: 'planId', as: 'plan' });

  // User 1:N AuthSession (refresh sessions die with the user)
  User.hasMany(AuthSession, {
    foreignKey: 'userId',
    as: 'authSessions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AuthSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User 1:N AuthIdentity (provider links die with the user)
  User.hasMany(AuthIdentity, {
    foreignKey: 'userId',
    as: 'authIdentities',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AuthIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User 1:N Route (traveller-owned route calculations die with the user)
  User.hasMany(Route, {
    foreignKey: 'travellerId',
    as: 'routes',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Route.belongsTo(User, { foreignKey: 'travellerId', as: 'traveller' });

  // Route 1:N RouteStop (stops are existence-dependent on the route)
  Route.hasMany(RouteStop, {
    foreignKey: 'routeId',
    as: 'stops',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  RouteStop.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

  // User 1:N TravelRequest (requests die with the user)
  User.hasMany(TravelRequest, {
    foreignKey: 'travellerId',
    as: 'travelRequests',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  TravelRequest.belongsTo(User, { foreignKey: 'travellerId', as: 'traveller' });

  // Route 1:N TravelRequest (RESTRICT: a referenced route cannot be
  // deleted silently — the request must be removed first)
  Route.hasMany(TravelRequest, {
    foreignKey: 'routeId',
    as: 'travelRequests',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  TravelRequest.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

  // TravelRequest 1:N TravelRequestDay (days die with the request)
  TravelRequest.hasMany(TravelRequestDay, {
    foreignKey: 'travelRequestId',
    as: 'days',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  TravelRequestDay.belongsTo(TravelRequest, {
    foreignKey: 'travelRequestId',
    as: 'travelRequest',
  });

  // TravelRequest 1:N TravelRequestAgency (matches die with the request)
  TravelRequest.hasMany(TravelRequestAgency, {
    foreignKey: 'travelRequestId',
    as: 'agencyMatches',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  TravelRequestAgency.belongsTo(TravelRequest, {
    foreignKey: 'travelRequestId',
    as: 'travelRequest',
  });

  // AgencyProfile 1:N TravelRequestAgency (matches die with the agency)
  AgencyProfile.hasMany(TravelRequestAgency, {
    foreignKey: 'agencyId',
    as: 'requestMatches',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  TravelRequestAgency.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // TravelRequest 1:N Quotation (quotations die with the request)
  TravelRequest.hasMany(Quotation, {
    foreignKey: 'travelRequestId',
    as: 'quotations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Quotation.belongsTo(TravelRequest, { foreignKey: 'travelRequestId', as: 'travelRequest' });

  // AgencyProfile 1:N Quotation (quotations die with the agency)
  AgencyProfile.hasMany(Quotation, {
    foreignKey: 'agencyId',
    as: 'quotations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Quotation.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // Quotation 1:N QuotationItem (items die with the quotation)
  Quotation.hasMany(QuotationItem, {
    foreignKey: 'quotationId',
    as: 'items',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

  // TravelRequest 1:N Conversation (threads die with the request)
  TravelRequest.hasMany(Conversation, {
    foreignKey: 'travelRequestId',
    as: 'conversations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Conversation.belongsTo(TravelRequest, { foreignKey: 'travelRequestId', as: 'travelRequest' });

  // User 1:N Conversation as traveller (threads die with the user)
  User.hasMany(Conversation, {
    foreignKey: 'travellerId',
    as: 'travellerConversations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Conversation.belongsTo(User, { foreignKey: 'travellerId', as: 'traveller' });

  // AgencyProfile 1:N Conversation (threads die with the agency)
  AgencyProfile.hasMany(Conversation, {
    foreignKey: 'agencyId',
    as: 'conversations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Conversation.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // Conversation 1:N Message (lines die with the thread)
  Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

  // User 1:N Message as sender (SET NULL keeps the thread readable)
  User.hasMany(Message, {
    foreignKey: 'senderUserId',
    as: 'sentMessages',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  Message.belongsTo(User, { foreignKey: 'senderUserId', as: 'sender' });

  // TravelRequest 1:N Job (jobs die with the request)
  TravelRequest.hasMany(Job, {
    foreignKey: 'travelRequestId',
    as: 'jobs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Job.belongsTo(TravelRequest, { foreignKey: 'travelRequestId', as: 'travelRequest' });

  // Quotation 1:N Job (RESTRICT: the accepted quotation cannot
  // disappear under a live job)
  Quotation.hasMany(Job, {
    foreignKey: 'quotationId',
    as: 'jobs',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Job.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

  // User 1:N Job as traveller (jobs die with the user)
  User.hasMany(Job, {
    foreignKey: 'travellerId',
    as: 'travellerJobs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Job.belongsTo(User, { foreignKey: 'travellerId', as: 'traveller' });

  // AgencyProfile 1:N Job (jobs die with the agency)
  AgencyProfile.hasMany(Job, {
    foreignKey: 'agencyId',
    as: 'jobs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Job.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // AgencyProfile 1:N Commission
  AgencyProfile.hasMany(Commission, {
    foreignKey: 'agencyId',
    as: 'commissions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Commission.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  // Job 1:1 Commission
  Job.hasOne(Commission, {
    foreignKey: 'jobId',
    as: 'commission',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Commission.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

  // Quotation 1:1 Commission
  Quotation.hasOne(Commission, {
    foreignKey: 'quotationId',
    as: 'commission',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Commission.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

  // Commission N:1 User (confirmer)
  Commission.belongsTo(User, {
    foreignKey: 'confirmedBy',
    as: 'confirmer',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // AuditLog N:1 User (actor)
  AuditLog.belongsTo(User, {
    foreignKey: 'actorUserId',
    as: 'actor',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // User 1:N Notification
  User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User 1:N PushToken
  User.hasMany(PushToken, {
    foreignKey: 'userId',
    as: 'pushTokens',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  PushToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // TravelGuideRegion 1:N TravelGuideDestination
  TravelGuideRegion.hasMany(TravelGuideDestination, {
    foreignKey: 'regionId',
    as: 'destinations',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  TravelGuideDestination.belongsTo(TravelGuideRegion, { foreignKey: 'regionId', as: 'region' });

  // TravelGuideRegion 1:N TravelGuideArticle
  TravelGuideRegion.hasMany(TravelGuideArticle, {
    foreignKey: 'regionId',
    as: 'articles',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  TravelGuideArticle.belongsTo(TravelGuideRegion, { foreignKey: 'regionId', as: 'region' });

  // TravelGuideDestination 1:N TravelGuideArticle
  TravelGuideDestination.hasMany(TravelGuideArticle, {
    foreignKey: 'destinationId',
    as: 'articles',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  TravelGuideArticle.belongsTo(TravelGuideDestination, {
    foreignKey: 'destinationId',
    as: 'destination',
  });

  // User 1:N TravelGuideArticle (author)
  User.hasMany(TravelGuideArticle, {
    foreignKey: 'authorId',
    as: 'authoredArticles',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  TravelGuideArticle.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

  // Job 1:1 Rating
  Job.hasOne(Rating, {
    foreignKey: 'jobId',
    as: 'rating',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Rating.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

  // TravelRequest 1:N Rating
  TravelRequest.hasMany(Rating, {
    foreignKey: 'travelRequestId',
    as: 'ratings',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Rating.belongsTo(TravelRequest, { foreignKey: 'travelRequestId', as: 'travelRequest' });

  // User 1:N Rating (traveller)
  User.hasMany(Rating, {
    foreignKey: 'travellerId',
    as: 'givenRatings',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Rating.belongsTo(User, { foreignKey: 'travellerId', as: 'traveller' });

  // AgencyProfile 1:N Rating
  AgencyProfile.hasMany(Rating, {
    foreignKey: 'agencyId',
    as: 'ratings',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Rating.belongsTo(AgencyProfile, { foreignKey: 'agencyId', as: 'agency' });

  registry = {
    sequelize,
    User,
    TravellerProfile,
    AgencyProfile,
    AgencyDocument,
    MembershipPlan,
    AgencyMembership,
    AuthSession,
    AuthIdentity,
    Route,
    RouteStop,
    TravelRequest,
    TravelRequestDay,
    TravelRequestAgency,
    Quotation,
    QuotationItem,
    Conversation,
    Message,
    Job,
    Commission,
    AuditLog,
    Notification,
    PushToken,
    WeatherCache,
    TravelGuideRegion,
    TravelGuideDestination,
    TravelGuideArticle,
    Rating,
  };

  return registry;
}

export {
  User,
  TravellerProfile,
  AgencyProfile,
  AgencyDocument,
  MembershipPlan,
  AgencyMembership,
  AuthSession,
  AuthIdentity,
  Route,
  RouteStop,
  TravelRequest,
  TravelRequestDay,
  TravelRequestAgency,
  Quotation,
  QuotationItem,
  Conversation,
  Message,
  Job,
  Commission,
  AuditLog,
  Notification,
  PushToken,
  WeatherCache,
  TravelGuideRegion,
  TravelGuideDestination,
  TravelGuideArticle,
  Rating,
};
