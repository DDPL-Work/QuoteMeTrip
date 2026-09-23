/**
 * AgencyMembership model (Phase 2 — persistence only).
 *
 * Links an agency profile to a membership plan for a time window.
 * Billing/payment workflows arrive in later phases.
 */
import { DataTypes, Model } from 'sequelize';

export const AGENCY_MEMBERSHIP_STATUSES = ['active', 'expired', 'cancelled'];

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
          defaultValue: 'active',
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
