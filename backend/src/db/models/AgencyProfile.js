/**
 * AgencyProfile model (Phase 2 & Phase 7 extension).
 *
 * One-to-one extension of `users` for agency business/profile data.
 */
import { DataTypes, Model } from 'sequelize';

export const AGENCY_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

export class AgencyProfile extends Model {
  static initModel(sequelize) {
    if (AgencyProfile.sequelize === sequelize) {
      return AgencyProfile;
    }
    AgencyProfile.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        agencyName: {
          type: DataTypes.STRING(160),
          allowNull: false,
          validate: { notEmpty: true },
        },
        contactPerson: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        businessEmail: {
          type: DataTypes.STRING(190),
          allowNull: true,
          validate: { isEmail: true },
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        logoPath: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...AGENCY_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
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
        tableName: 'agency_profiles',
        modelName: 'AgencyProfile',
        indexes: [{ unique: true, fields: ['user_id'] }, { fields: ['status'] }],
      },
    );

    return AgencyProfile;
  }
}
