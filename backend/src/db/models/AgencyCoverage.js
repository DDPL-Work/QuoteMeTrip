import { DataTypes, Model } from 'sequelize';

export class AgencyCoverage extends Model {
  static initModel(sequelize) {
    if (AgencyCoverage.sequelize === sequelize) {
      return AgencyCoverage;
    }
    AgencyCoverage.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'agency_id',
        },
        destinationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'travel_guide_destinations', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'destination_id',
        },
        regionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'travel_guide_regions', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'region_id',
        },
        locationName: {
          type: DataTypes.STRING(190),
          allowNull: false,
          field: 'location_name',
        },
      },
      {
        sequelize,
        tableName: 'agency_coverages',
        modelName: 'AgencyCoverage',
        underscored: true,
        indexes: [
          { fields: ['agency_id'] },
          { fields: ['location_name'] },
          { unique: true, fields: ['agency_id', 'location_name'] },
        ],
      },
    );

    return AgencyCoverage;
  }
}
