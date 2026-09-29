/**
 * Migration: create `travel_request_days` (day-by-day plan rows).
 * UNIQUE(travel_request_id, day_number) enforces unique day numbers.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_request_days', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    travel_request_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'travel_requests', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    day_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
    date: { type: Sequelize.DATEONLY, allowNull: true },
    location: { type: Sequelize.STRING(190), allowNull: true },
    title: { type: Sequelize.STRING(190), allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    hotel_notes: { type: Sequelize.TEXT, allowNull: true },
    guide_notes: { type: Sequelize.TEXT, allowNull: true },
    driver_notes: { type: Sequelize.TEXT, allowNull: true },
    special_requirements: { type: Sequelize.TEXT, allowNull: true },
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

  await queryInterface.addIndex('travel_request_days', ['travel_request_id'], {
    name: 'travel_request_days_request_id_idx',
  });
  await queryInterface.addIndex('travel_request_days', ['travel_request_id', 'day_number'], {
    unique: true,
    name: 'travel_request_days_request_day_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('travel_request_days');
}
