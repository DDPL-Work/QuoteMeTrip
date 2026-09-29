/**
 * Migration: create `route_stops` (ordered stops of a route).
 * UNIQUE(route_id, sequence) enforces an explicit stop order.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('route_stops', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    route_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'routes', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sequence: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
    stop_type: {
      type: Sequelize.ENUM('start', 'intermediate', 'final'),
      allowNull: false,
      defaultValue: 'intermediate',
    },
    location_name: { type: Sequelize.STRING(190), allowNull: false },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
    place_id: { type: Sequelize.STRING(190), allowNull: true },
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

  await queryInterface.addIndex('route_stops', ['route_id'], {
    name: 'route_stops_route_id_idx',
  });
  await queryInterface.addIndex('route_stops', ['route_id', 'sequence'], {
    unique: true,
    name: 'route_stops_route_sequence_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('route_stops');
}
