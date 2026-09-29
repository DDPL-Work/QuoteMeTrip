import { DataTypes, Model } from 'sequelize';

export class TravelGuideDestination extends Model {
  static initModel(sequelize) {
    if (TravelGuideDestination.sequelize === sequelize) {
      return TravelGuideDestination;
    }
    TravelGuideDestination.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        regionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'travel_guide_regions', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
          field: 'region_id',
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        shortDescription: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'short_description',
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('draft', 'published', 'archived'),
          allowNull: false,
          defaultValue: 'draft',
        },
        sortOrder: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'sort_order',
        },
      },
      {
        sequelize,
        tableName: 'travel_guide_destinations',
        modelName: 'TravelGuideDestination',
        underscored: true,
        indexes: [{ fields: ['region_id'] }],
      },
    );

    return TravelGuideDestination;
  }
}
