/**
 * Route model (Phase 4 — traveller route planning).
 *
 * A persisted, traveller-owned route calculation: start + optional
 * intermediate stops + final destination along with the provider
 * result (distance, duration, recommendation, geometry). The
 * `raw_route_data` JSON preserves the provider response for audit
 * and future re-calculation without re-querying the provider.
 */
import { DataTypes, Model } from 'sequelize';

export class Route extends Model {
  static initModel(sequelize) {
    if (Route.sequelize === sequelize) {
      return Route;
    }
    Route.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        travellerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        startLocation: {
          type: DataTypes.STRING(190),
          allowNull: false,
        },
        finalDestination: {
          type: DataTypes.STRING(190),
          allowNull: false,
        },
        totalDistanceKm: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        estimatedDurationMinutes: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        recommendedDays: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        calculationProvider: {
          type: DataTypes.STRING(60),
          allowNull: false,
          defaultValue: 'haversine',
        },
        calculationVersion: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'v1',
        },
        rawRouteData: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'routes',
        modelName: 'Route',
        indexes: [{ fields: ['traveller_id'] }],
      },
    );

    return Route;
  }
}
