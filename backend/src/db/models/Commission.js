/**
 * Commission model (Phase 7).
 *
 * Tracks administrative commission records for accepted marketplace jobs.
 */
import { DataTypes, Model } from 'sequelize';

export const COMMISSION_STATUSES = ['pending', 'confirmed', 'cancelled', 'paid'];

export class Commission extends Model {
  static initModel(sequelize) {
    if (Commission.sequelize === sequelize) {
      return Commission;
    }
    Commission.init(
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
        jobId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'jobs', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        quotationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'quotations', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        jobAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        commissionRate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 10.0,
        },
        commissionAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        status: {
          type: DataTypes.ENUM(...COMMISSION_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
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
      },
      {
        sequelize,
        tableName: 'commissions',
        modelName: 'Commission',
        indexes: [
          { fields: ['agency_id'] },
          { fields: ['job_id'] },
          { fields: ['quotation_id'] },
          { fields: ['status'] },
        ],
      },
    );

    return Commission;
  }
}
