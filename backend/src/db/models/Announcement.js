/**
 * Announcement model (Phase 7.5 / Workstream 3).
 *
 * Dedicated admin broadcasting model for notices to travellers and agencies.
 */
import { DataTypes, Model } from 'sequelize';

export const ANNOUNCEMENT_AUDIENCES = ['all', 'travellers', 'agencies'];
export const ANNOUNCEMENT_TYPES = ['general', 'info', 'maintenance', 'important', 'urgent'];
export const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const ANNOUNCEMENT_STATUSES = ['draft', 'published', 'archived', 'withdrawn'];

export class Announcement extends Model {
  static initModel(sequelize) {
    if (Announcement.sequelize === sequelize) {
      return Announcement;
    }

    Announcement.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: { notEmpty: true },
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: { notEmpty: true },
        },
        targetAudience: {
          type: DataTypes.ENUM(...ANNOUNCEMENT_AUDIENCES),
          allowNull: false,
          defaultValue: 'all',
          field: 'target_audience',
        },
        type: {
          type: DataTypes.ENUM(...ANNOUNCEMENT_TYPES),
          allowNull: false,
          defaultValue: 'general',
        },
        priority: {
          type: DataTypes.ENUM(...ANNOUNCEMENT_PRIORITIES),
          allowNull: false,
          defaultValue: 'normal',
        },
        actionLabel: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'action_label',
        },
        actionUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'action_url',
        },
        status: {
          type: DataTypes.ENUM(...ANNOUNCEMENT_STATUSES),
          allowNull: false,
          defaultValue: 'draft',
        },
        titleTr: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'title_tr',
        },
        messageTr: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'message_tr',
        },
        actionLabelTr: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'action_label_tr',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'expires_at',
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'published_at',
        },
        recipientCount: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'recipient_count',
        },
        createdBy: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          field: 'created_by',
        },
      },
      {
        sequelize,
        tableName: 'announcements',
        modelName: 'Announcement',
        underscored: true,
        indexes: [
          { fields: ['status'] },
          { fields: ['target_audience'] },
          { fields: ['published_at'] },
        ],
      },
    );

    return Announcement;
  }
}
