/**
 * AgencyMembership model (Phase 2 & Phase 7 extension).
 *
 * Links an agency profile to a membership plan for a time window.
 * Phase 7 adds manual payment confirmation, agreement tracking, and expanded statuses.
 */
import { DataTypes, Model } from 'sequelize';

export const AGENCY_MEMBERSHIP_STATUSES = [
  'pending',
  'active',
  'expired',
  'suspended',
  'cancelled',
];

export class AgencyMembership extends Model {
  static initModel(sequelize) {
    if (AgencyMembership.sequelize === sequelize) {
      return AgencyMembership;
    }
    AgencyMembership.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        planId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'membership_plans', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        startsAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endsAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...AGENCY_MEMBERSHIP_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        confirmedBy: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        confirmedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        paymentReference: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        agreementAccepted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        agreementAcceptedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        agreementVersion: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'agency_memberships',
        modelName: 'AgencyMembership',
        indexes: [{ fields: ['agency_id'] }, { fields: ['plan_id'] }, { fields: ['status'] }],
      },
    );

    return AgencyMembership;
  }
}
