/**
 * User model (Phase 2 — persistence only).
 *
 * Foundational identity record for all three application domains
 * (traveller, agency, admin). Authentication (password hashing,
 * JWT, OAuth) is NOT implemented here — this model only establishes
 * the storage representation. `passwordHash` is therefore nullable
 * until the authentication phase populates it.
 */
import { DataTypes, Model } from 'sequelize';

export const USER_ROLES = ['traveller', 'agency', 'admin'];
export const USER_STATUSES = ['active', 'inactive', 'suspended'];

export class User extends Model {
  static initModel(sequelize) {
    if (User.sequelize === sequelize) {
      return User;
    }
    User.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
          validate: { notEmpty: true },
        },
        email: {
          type: DataTypes.STRING(190),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        role: {
          type: DataTypes.ENUM(...USER_ROLES),
          allowNull: false,
          defaultValue: 'traveller',
        },
        status: {
          type: DataTypes.ENUM(...USER_STATUSES),
          allowNull: false,
          defaultValue: 'active',
        },
      },
      {
        sequelize,
        tableName: 'users',
        modelName: 'User',
        indexes: [
          { unique: true, fields: ['email'] },
          { fields: ['role'] },
          { fields: ['status'] },
        ],
      },
    );

    return User;
  }
}
