export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('weather_cache', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    location_key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    provider: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    response: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
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

  await queryInterface.addIndex('weather_cache', ['location_key', 'date']);
  await queryInterface.addIndex('weather_cache', ['expires_at']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('weather_cache');
}
