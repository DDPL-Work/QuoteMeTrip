/**
 * AuthIdentity model (Phase 3 — social provider linkage).
 *
 * Normalized `provider + provider_user_id` identity records. Only
 * `google` is supported in Phase 3, and only for the traveller role
 * (agency social login is rejected by the auth service, never by
 * frontend hiding alone). The composite unique constraint guarantees
 * one local user per provider identity.
 */
import { DataTypes, Model } from 'sequelize';

export const AUTH_PROVIDERS = ['google'];

export class AuthIdentity extends Model {
  static initModel(sequelize) {
    if (AuthIdentity.sequelize === sequelize) {
      return AuthIdentity;
    }
    AuthIdentity.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        provider: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        providerUserId: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        providerEmail: {
          type: DataTypes.STRING(190),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'auth_identities',
        modelName: 'AuthIdentity',
        indexes: [
          { fields: ['user_id'] },
          { unique: true, fields: ['provider', 'provider_user_id'] },
        ],
      },
    );

    return AuthIdentity;
  }
}
