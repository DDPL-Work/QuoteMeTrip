/**
 * AuditLog model (Phase 7).
 *
 * Persists operational administrative actions with before/after state diffs.
 */
import { DataTypes, Model } from 'sequelize';

export class AuditLog extends Model {
  static initModel(sequelize) {
    if (AuditLog.sequelize === sequelize) {
      return AuditLog;
    }
    AuditLog.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        actorUserId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        action: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        entityType: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        entityId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        beforeState: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        afterState: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'audit_logs',
        modelName: 'AuditLog',
        indexes: [
          { fields: ['actor_user_id'] },
          { fields: ['action'] },
          { fields: ['entity_type', 'entity_id'] },
        ],
      },
    );

    return AuditLog;
  }
}
