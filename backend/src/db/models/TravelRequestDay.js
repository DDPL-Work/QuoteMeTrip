/**
 * TravelRequestDay model (Phase 4).
 *
 * Day-by-day plan rows owned by a TravelRequest. `dayNumber` is
 * unique per request (1-based). Dates must be valid and ordered;
 * ownership is enforced through the parent request.
 */
import { DataTypes, Model } from 'sequelize';

export class TravelRequestDay extends Model {
  static initModel(sequelize) {
    if (TravelRequestDay.sequelize === sequelize) {
      return TravelRequestDay;
    }
    TravelRequestDay.init(
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
        dayNumber: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        location: {
          type: DataTypes.STRING(190),
          allowNull: true,
        },
        title: {
          type: DataTypes.STRING(190),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        hotelNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        guideNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        driverNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        specialRequirements: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'travel_request_days',
        modelName: 'TravelRequestDay',
        indexes: [
          { fields: ['travel_request_id'] },
          { unique: true, fields: ['travel_request_id', 'day_number'] },
        ],
      },
    );

    return TravelRequestDay;
  }
}
