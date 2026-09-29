/**
 * RouteStop model (Phase 4).
 *
 * One ordered stop of a Route. `sequence` is 0-based in stop order.
 * `stopType`: start | intermediate | final. Coordinates are required
 * for routing; `placeId` is an opaque provider reference (optional).
 */
import { DataTypes, Model } from 'sequelize';

export const ROUTE_STOP_TYPES = ['start', 'intermediate', 'final'];

export class RouteStop extends Model {
  static initModel(sequelize) {
    if (RouteStop.sequelize === sequelize) {
      return RouteStop;
    }
    RouteStop.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        routeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'routes', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        sequence: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        stopType: {
          type: DataTypes.ENUM(...ROUTE_STOP_TYPES),
          allowNull: false,
          defaultValue: 'intermediate',
        },
        locationName: {
          type: DataTypes.STRING(190),
          allowNull: false,
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: false,
        },
        longitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: false,
        },
        placeId: {
          type: DataTypes.STRING(190),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'route_stops',
        modelName: 'RouteStop',
        indexes: [{ fields: ['route_id'] }, { unique: true, fields: ['route_id', 'sequence'] }],
      },
    );

    return RouteStop;
  }
}
