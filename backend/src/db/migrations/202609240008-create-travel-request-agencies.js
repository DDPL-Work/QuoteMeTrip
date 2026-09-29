/**
 * Migration: create `travel_request_agencies` (agency matches).
 * UNIQUE(travel_request_id, agency_id) prevents duplicate matches.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_request_agencies', {
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
    agency_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'agency_profiles', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    match_status: {
      type: Sequelize.ENUM('matched', 'viewed', 'quoted', 'declined', 'expired', 'withdrawn'),
      allowNull: false,
      defaultValue: 'matched',
    },
    matched_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    viewed_at: { type: Sequelize.DATE, allowNull: true },
    responded_at: { type: Sequelize.DATE, allowNull: true },
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

  await queryInterface.addIndex('travel_request_agencies', ['travel_request_id'], {
    name: 'tra_travel_request_id_idx',
  });
  await queryInterface.addIndex('travel_request_agencies', ['agency_id'], {
    name: 'tra_agency_id_idx',
  });
  await queryInterface.addIndex('travel_request_agencies', ['match_status'], {
    name: 'tra_match_status_idx',
  });
  await queryInterface.addIndex('travel_request_agencies', ['travel_request_id', 'agency_id'], {
    unique: true,
    name: 'tra_request_agency_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('travel_request_agencies');
}
