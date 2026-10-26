import { DataTypes, Model } from 'sequelize';

export class TranslationCache extends Model {
  static initModel(sequelize) {
    if (TranslationCache.sequelize === sequelize) {
      return TranslationCache;
    }

    TranslationCache.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        cacheKey: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          field: 'cache_key',
        },
        contentType: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'content_type',
        },
        contentId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'content_id',
        },
        fieldName: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'field_name',
        },
        sourceLanguage: {
          type: DataTypes.STRING(16),
          allowNull: false,
          field: 'source_language',
        },
        targetLanguage: {
          type: DataTypes.STRING(16),
          allowNull: false,
          field: 'target_language',
        },
        sourceContentHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'source_content_hash',
        },
        translatedText: {
          type: DataTypes.TEXT('medium'),
          allowNull: false,
          field: 'translated_text',
        },
        translationProvider: {
          type: DataTypes.STRING(64),
          allowNull: false,
          defaultValue: 'google_cloud_v3',
          field: 'translation_provider',
        },
        translationVersion: {
          type: DataTypes.STRING(64),
          allowNull: false,
          defaultValue: 'v1',
          field: 'translation_version',
        },
        scope: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'public',
        },
      },
      {
        sequelize,
        tableName: 'translation_cache',
        modelName: 'TranslationCache',
        underscored: true,
        indexes: [
          { unique: true, fields: ['cache_key'] },
          { fields: ['content_type', 'content_id', 'field_name', 'target_language'] },
          { fields: ['source_content_hash'] },
        ],
      },
    );

    return TranslationCache;
  }
}
