/**
 * Migration: create `conversations` (traveller ↔ agency threads).
 * UNIQUE(travel_request_id, traveller_id, agency_id) prevents
 * duplicate active conversations for the same triple.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('conversations', {
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
    traveller_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
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
    status: {
      type: Sequelize.ENUM('active', 'closed'),
      allowNull: false,
      defaultValue: 'active',
    },
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

  await queryInterface.addIndex('conversations', ['travel_request_id'], {
    name: 'conversations_travel_request_id_idx',
  });
  await queryInterface.addIndex('conversations', ['traveller_id'], {
    name: 'conversations_traveller_id_idx',
  });
  await queryInterface.addIndex('conversations', ['agency_id'], {
    name: 'conversations_agency_id_idx',
  });
  await queryInterface.addIndex('conversations', ['status'], {
    name: 'conversations_status_idx',
  });
  await queryInterface.addIndex(
    'conversations',
    ['travel_request_id', 'traveller_id', 'agency_id'],
    { unique: true, name: 'conversations_request_traveller_agency_unique' },
  );
}

export async function down(queryInterface) {
  await queryInterface.dropTable('conversations');
}
