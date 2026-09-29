import { DataTypes, Model } from 'sequelize';

export class TravelGuideArticle extends Model {
  static initModel(sequelize) {
    if (TravelGuideArticle.sequelize === sequelize) {
      return TravelGuideArticle;
    }
    TravelGuideArticle.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        regionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'travel_guide_regions', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          field: 'region_id',
        },
        destinationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'travel_guide_destinations', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          field: 'destination_id',
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        excerpt: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT('long'),
          allowNull: true,
        },
        coverImage: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'cover_image',
        },
        status: {
          type: DataTypes.ENUM('draft', 'published', 'archived'),
          allowNull: false,
          defaultValue: 'draft',
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'published_at',
        },
        authorId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          field: 'author_id',
        },
      },
      {
        sequelize,
        tableName: 'travel_guide_articles',
        modelName: 'TravelGuideArticle',
        underscored: true,
        indexes: [
          { fields: ['region_id'] },
          { fields: ['destination_id'] },
          { fields: ['status'] },
          { fields: ['author_id'] },
        ],
      },
    );

    return TravelGuideArticle;
  }
}
