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
        contentJson: {
          type: DataTypes.JSON,
          allowNull: true,
          field: 'content_json',
        },
        coverImage: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'cover_image',
        },
        coverImageAlt: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'cover_image_alt',
        },
        metaTitle: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'meta_title',
        },
        metaDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'meta_description',
        },
        canonicalUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'canonical_url',
        },
        metaRobots: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: 'index, follow',
          field: 'meta_robots',
        },
        ogTitle: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'og_title',
        },
        ogDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'og_description',
        },
        ogImage: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'og_image',
        },
        twitterCard: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: 'summary_large_image',
          field: 'twitter_card',
        },
        focusKeyword: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'focus_keyword',
        },
        relatedKeywords: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'related_keywords',
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
