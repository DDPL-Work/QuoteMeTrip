export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('push_tokens', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    platform: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    last_used_at: {
      type: Sequelize.DATE,
      allowNull: true,
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

  await queryInterface.addIndex('push_tokens', ['user_id']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('push_tokens');
}
