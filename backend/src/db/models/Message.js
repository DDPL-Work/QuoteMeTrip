/**
 * Message model (Phase 6).
 *
 * Conversation lines. `senderUserId` is nullable for system messages
 * (acceptance notices, …) which have no human sender; the REST layer
 * only accepts `text` from participants. ON DELETE SET NULL keeps the
 * thread readable if a user is removed.
 */
import { DataTypes, Model } from 'sequelize';

export const MESSAGE_TYPES = ['text', 'system'];
export const MAX_MESSAGE_LENGTH = 5000;

export class Message extends Model {
  static initModel(sequelize) {
    if (Message.sequelize === sequelize) {
      return Message;
    }
    Message.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        conversationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'conversations', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        senderUserId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        messageType: {
          type: DataTypes.ENUM(...MESSAGE_TYPES),
          allowNull: false,
          defaultValue: 'text',
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        deletedForEveryoneAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_for_everyone_at',
        },
        deletedByUserId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'deleted_by_user_id',
          references: { model: 'users', key: 'id' },
        },
        deletedForUsers: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
          field: 'deleted_for_users',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'expires_at',
        },
      },
      {
        sequelize,
        tableName: 'messages',
        modelName: 'Message',
        indexes: [
          { fields: ['conversation_id'] },
          { fields: ['sender_user_id'] },
          { fields: ['conversation_id', 'created_at'] },
        ],
      },
    );

    return Message;
  }
}
