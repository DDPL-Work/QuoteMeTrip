/**
 * Migration: add version and parent_quotation_id to quotations,
 * chosen_duration to travel_requests, and composite performance indexes.
 */
async function safeAddColumn(queryInterface, tableName, columnName, spec) {
  try {
    await queryInterface.addColumn(tableName, columnName, spec);
  } catch (err) {
    if (err.original?.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_FIELDNAME') {
      return;
    }
    throw err;
  }
}

async function safeAddIndex(queryInterface, tableName, attributes, options) {
  try {
    await queryInterface.addIndex(tableName, attributes, options);
  } catch (err) {
    if (err.original?.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_KEYNAME') {
      return;
    }
    throw err;
  }
}

export async function up(queryInterface, Sequelize) {
  // 1. Versioning and revision relationship on quotations
  await safeAddColumn(queryInterface, 'quotations', 'version', {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  });

  await safeAddColumn(queryInterface, 'quotations', 'parent_quotation_id', {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'quotations', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // 2. chosen_duration on travel_requests
  await safeAddColumn(queryInterface, 'travel_requests', 'chosen_duration', {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // 3. Composite indexes for high-frequency queries
  await safeAddIndex(queryInterface, 'quotations', ['travel_request_id', 'created_at'], {
    name: 'quotations_travel_request_created_idx',
  });

  await safeAddIndex(queryInterface, 'quotations', ['travel_request_id', 'status', 'created_at'], {
    name: 'quotations_request_status_created_idx',
  });

  await safeAddIndex(queryInterface, 'quotations', ['agency_id', 'travel_request_id', 'created_at'], {
    name: 'quotations_agency_request_created_idx',
  });
}

export async function down(queryInterface) {
  try { await queryInterface.removeIndex('quotations', 'quotations_agency_request_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('quotations', 'quotations_request_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('quotations', 'quotations_travel_request_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('travel_requests', 'chosen_duration'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('quotations', 'parent_quotation_id'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('quotations', 'version'); } catch { /* ignore */ }
}
