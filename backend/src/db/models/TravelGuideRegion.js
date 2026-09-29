import { DataTypes, Model } from 'sequelize';

export class TravelGuideRegion extends Model {
  static initModel(sequelize) {
    if (TravelGuideRegion.sequelize === sequelize) {
      return TravelGuideRegion;
    }
    TravelGuideRegion.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
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
        image: {
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
        tableName: 'travel_guide_regions',
        modelName: 'TravelGuideRegion',
        underscored: true,
      },
    );

    return TravelGuideRegion;
  }
}
