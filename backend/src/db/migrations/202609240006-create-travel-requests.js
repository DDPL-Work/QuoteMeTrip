/**
 * Migration: create `travel_requests` (draft-first traveller workflow).
 *
 * `route_id` uses RESTRICT so a route referenced by a request cannot
 * be deleted silently — the request must be removed first.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_requests', {
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
    route_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'routes', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    status: {
      type: Sequelize.ENUM(
        'draft',
        'submitted',
        'matching',
        'quoted',
        'accepted',
        'cancelled',
        'completed',
      ),
      allowNull: false,
      defaultValue: 'draft',
    },
    travel_start_date: { type: Sequelize.DATEONLY, allowNull: true },
    travel_end_date: { type: Sequelize.DATEONLY, allowNull: true },
    number_of_travellers: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    luggage_count: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    accommodation_type: {
      type: Sequelize.ENUM('3_star', '4_star', '5_star', 's_class'),
      allowNull: true,
    },
    hotel_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    guide_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    driver_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    package_type: {
      type: Sequelize.ENUM('hotel_only', 'vehicle_driver', 'full_package'),
      allowNull: true,
    },
    special_requests: { type: Sequelize.TEXT, allowNull: true },
    submitted_at: { type: Sequelize.DATE, allowNull: true },
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

  await queryInterface.addIndex('travel_requests', ['traveller_id'], {
    name: 'travel_requests_traveller_id_idx',
  });
  await queryInterface.addIndex('travel_requests', ['route_id'], {
    name: 'travel_requests_route_id_idx',
  });
  await queryInterface.addIndex('travel_requests', ['status'], {
    name: 'travel_requests_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('travel_requests');
}
