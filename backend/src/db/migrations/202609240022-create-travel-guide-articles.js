export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_guide_articles', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    region_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'travel_guide_regions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    destination_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'travel_guide_destinations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    content: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    },
    cover_image: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    published_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    author_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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

  try { await queryInterface.addIndex('travel_guide_articles', ['region_id']); } catch { /* index exists */ }
  try { await queryInterface.addIndex('travel_guide_articles', ['destination_id']); } catch { /* index exists */ }
  try { await queryInterface.addIndex('travel_guide_articles', ['status']); } catch { /* index exists */ }
  try { await queryInterface.addIndex('travel_guide_articles', ['author_id']); } catch { /* index exists */ }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('travel_guide_articles');
}
