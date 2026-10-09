import { DataTypes, Model } from 'sequelize';

export class Notification extends Model {
  static initModel(sequelize) {
    if (Notification.sequelize === sequelize) {
      return Notification;
    }
    Notification.init(
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
          field: 'user_id',
        },
        eventType: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'event_type',
        },
        channel: {
          type: DataTypes.ENUM('in_app', 'email', 'sms', 'web_push'),
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        data: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
          allowNull: false,
          defaultValue: 'pending',
        },
        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'read_at',
        },
        sentAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'sent_at',
        },
        failedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'failed_at',
        },
        failureReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'failure_reason',
        },
      },
      {
        sequelize,
        tableName: 'notifications',
        modelName: 'Notification',
        underscored: true,
        indexes: [
          { fields: ['user_id'] },
          { fields: ['event_type'] },
          { fields: ['status'] },
          { fields: ['created_at'] },
          { fields: ['user_id', 'read_at'] },
          { fields: ['user_id', 'read_at', 'created_at'] },
        ],
      },
    );

    return Notification;
  }
}
