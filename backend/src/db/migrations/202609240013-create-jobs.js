/**
 * Migration: create `jobs` (accepted quotation work tracking).
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('jobs', {
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
    quotation_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'quotations', key: 'id' },
      onDelete: 'RESTRICT',
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
      type: Sequelize.ENUM('accepted', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'accepted',
    },
    accepted_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    started_at: { type: Sequelize.DATE, allowNull: true },
    completed_at: { type: Sequelize.DATE, allowNull: true },
    cancelled_at: { type: Sequelize.DATE, allowNull: true },
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

  await queryInterface.addIndex('jobs', ['travel_request_id'], {
    name: 'jobs_travel_request_id_idx',
  });
  await queryInterface.addIndex('jobs', ['quotation_id'], {
    name: 'jobs_quotation_id_idx',
  });
  await queryInterface.addIndex('jobs', ['traveller_id'], {
    name: 'jobs_traveller_id_idx',
  });
  await queryInterface.addIndex('jobs', ['agency_id'], {
    name: 'jobs_agency_id_idx',
  });
  await queryInterface.addIndex('jobs', ['status'], { name: 'jobs_status_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('jobs');
}
