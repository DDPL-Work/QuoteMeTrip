/**
 * Migration: create `routes` (traveller-owned route calculations).
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('routes', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    traveller_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    start_location: { type: Sequelize.STRING(190), allowNull: false },
    final_destination: { type: Sequelize.STRING(190), allowNull: false },
    total_distance_km: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estimated_duration_minutes: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    recommended_days: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    calculation_provider: {
      type: Sequelize.STRING(60),
      allowNull: false,
      defaultValue: 'haversine',
    },
    calculation_version: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'v1',
    },
    raw_route_data: { type: Sequelize.JSON, allowNull: true },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('routes', ['traveller_id'], { name: 'routes_traveller_id_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('routes');
}
