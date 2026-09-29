/**
 * Migration: create `quotations` (agency quotations for requests).
 * UNIQUE(travel_request_id, agency_id) enforces one quotation thread
 * per agency/request in Phase 5 (withdrawn rows keep history; a new
 * draft after withdrawal is a separate row only if the old one is
 * withdrawn — enforced in service logic, see quotation.service.js).
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('quotations', {
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
    status: {
      type: Sequelize.ENUM('draft', 'submitted', 'withdrawn', 'expired', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    quotation_type: {
      type: Sequelize.ENUM('hotel_only', 'vehicle_driver', 'full_package'),
      allowNull: false,
    },
    currency: {
      type: Sequelize.CHAR(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    subtotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    valid_until: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
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

  await queryInterface.addIndex('quotations', ['travel_request_id'], {
    name: 'quotations_travel_request_id_idx',
  });
  await queryInterface.addIndex('quotations', ['agency_id'], {
    name: 'quotations_agency_id_idx',
  });
  await queryInterface.addIndex('quotations', ['status'], {
    name: 'quotations_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('quotations');
}
