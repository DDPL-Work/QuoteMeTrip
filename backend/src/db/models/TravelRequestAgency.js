/**
 * TravelRequestAgency model (Phase 5 — agency matching).
 *
 * One row per matched agency/request pair. UNIQUE(travel_request_id,
 * agency_id) prevents duplicate matches. Status advances
 * matched → viewed → quoted (or declined/expired/withdrawn).
 */
import { DataTypes, Model } from 'sequelize';

export const TRAVEL_REQUEST_AGENCY_STATUSES = [
  'matched',
  'viewed',
  'quoted',
  'declined',
  'expired',
  'withdrawn',
];

export class TravelRequestAgency extends Model {
  static initModel(sequelize) {
    if (TravelRequestAgency.sequelize === sequelize) {
      return TravelRequestAgency;
    }
    TravelRequestAgency.init(
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
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        matchStatus: {
          type: DataTypes.ENUM(...TRAVEL_REQUEST_AGENCY_STATUSES),
          allowNull: false,
          defaultValue: 'matched',
        },
        matchedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        viewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        respondedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'travel_request_agencies',
        modelName: 'TravelRequestAgency',
        underscored: true,
        indexes: [
          { fields: ['travel_request_id'] },
          { fields: ['agency_id'] },
          { fields: ['match_status'] },
          { unique: true, fields: ['travel_request_id', 'agency_id'] },
        ],
      },
    );

    return TravelRequestAgency;
  }
}
