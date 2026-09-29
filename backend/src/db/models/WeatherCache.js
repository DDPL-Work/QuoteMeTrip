import { DataTypes, Model } from 'sequelize';

export class WeatherCache extends Model {
  static initModel(sequelize) {
    if (WeatherCache.sequelize === sequelize) {
      return WeatherCache;
    }
    WeatherCache.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        locationKey: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'location_key',
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        provider: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        response: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at',
        },
      },
      {
        sequelize,
        tableName: 'weather_cache',
        modelName: 'WeatherCache',
        underscored: true,
        indexes: [{ fields: ['location_key', 'date'] }, { fields: ['expires_at'] }],
      },
    );

    return WeatherCache;
  }
}
