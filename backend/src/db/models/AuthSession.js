/**
 * AuthSession model (Phase 3 — refresh-session storage).
 *
 * One row per issued refresh token. The raw refresh token is NEVER
 * stored — only its SHA-256 hash (`tokenHash`). Rotation links the
 * old session to its replacement (`replacedBySessionId`) within a
 * `tokenFamily`, which enables refresh-token reuse detection: if a
 * revoked/rotated token is presented again, the whole family is
 * revoked and the user must re-authenticate.
 */
import { DataTypes, Model } from 'sequelize';

export class AuthSession extends Model {
  static initModel(sequelize) {
    if (AuthSession.sequelize === sequelize) {
      return AuthSession;
    }
    AuthSession.init(
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
        tokenHash: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          unique: true,
        },
        tokenFamily: {
          type: DataTypes.CHAR(36),
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        revokedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        replacedBySessionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'auth_sessions', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'auth_sessions',
        modelName: 'AuthSession',
        indexes: [
          { fields: ['user_id'] },
          { unique: true, fields: ['token_hash'] },
          { fields: ['token_family'] },
          { fields: ['expires_at'] },
        ],
      },
    );

    return AuthSession;
  }

  /** A session is usable only while unrevoked and unexpired. */
  get isActive() {
    return this.revokedAt === null && this.expiresAt.getTime() > Date.now();
  }
}
