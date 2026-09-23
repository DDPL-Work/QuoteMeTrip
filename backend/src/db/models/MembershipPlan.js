/**
 * MembershipPlan model (Phase 2 — persistence only).
 *
 * Catalogue of agency membership/subscription plans. Payment
 * processing, checkout, and subscription billing arrive in later
 * phases — this model only establishes the plan representation.
 */
import { DataTypes, Model } from 'sequelize';

export const MEMBERSHIP_PLAN_STATUSES = ['active', 'inactive'];

export class MembershipPlan extends Model {
  static initModel(sequelize) {
    if (MembershipPlan.sequelize === sequelize) {
      return MembershipPlan;
    }
    MembershipPlan.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true,
          validate: { notEmpty: true },
        },
        slug: {
          type: DataTypes.STRING(140),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        currency: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        durationDays: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...MEMBERSHIP_PLAN_STATUSES),
          allowNull: false,
          defaultValue: 'active',
        },
      },
      {
        sequelize,
        tableName: 'membership_plans',
        modelName: 'MembershipPlan',
        indexes: [
          { unique: true, fields: ['name'] },
          { unique: true, fields: ['slug'] },
          { fields: ['status'] },
        ],
      },
    );

    return MembershipPlan;
  }
}
