export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('translation_cache', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    cache_key: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    content_type: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    content_id: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    field_name: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    source_language: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    target_language: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    source_content_hash: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    translated_text: {
      type: Sequelize.TEXT('medium'),
      allowNull: false,
    },
    translation_provider: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'google_cloud_v3',
    },
    translation_version: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'v1',
    },
    scope: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'public',
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('translation_cache', ['cache_key'], {
    unique: true,
    name: 'translation_cache_cache_key_unique',
  });
  await queryInterface.addIndex(
    'translation_cache',
    ['content_type', 'content_id', 'field_name', 'target_language'],
    {
      name: 'translation_cache_lookup_idx',
    },
  );
  await queryInterface.addIndex('translation_cache', ['source_content_hash'], {
    name: 'translation_cache_source_hash_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('translation_cache');
}
