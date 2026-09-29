/**
 * Conversation model (Phase 6).
 *
 * Exactly one Traveller and one Agency per travel request.
 * UNIQUE(travel_request_id, traveller_id, agency_id) blocks duplicate
 * active conversations for the same triple.
 */
import { DataTypes, Model } from 'sequelize';

export const CONVERSATION_STATUSES = ['active', 'closed'];

export class Conversation extends Model {
  static initModel(sequelize) {
    if (Conversation.sequelize === sequelize) {
      return Conversation;
    }
    Conversation.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        travelRequestId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'travel_requests', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        travellerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        status: {
          type: DataTypes.ENUM(...CONVERSATION_STATUSES),
          allowNull: false,
          defaultValue: 'active',
        },
      },
      {
        sequelize,
        tableName: 'conversations',
        modelName: 'Conversation',
        indexes: [
          { fields: ['travel_request_id'] },
          { fields: ['traveller_id'] },
          { fields: ['agency_id'] },
          { fields: ['status'] },
          { unique: true, fields: ['travel_request_id', 'traveller_id', 'agency_id'] },
        ],
      },
    );

    return Conversation;
  }
}
