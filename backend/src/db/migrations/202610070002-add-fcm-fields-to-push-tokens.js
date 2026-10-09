/**
 * Migration: Add FCM/FID device fields to push_tokens,
 * and composite performance index to notifications (Phase 8 FCM).
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
  // 1. Add FID and device metadata fields to push_tokens
  await safeAddColumn(queryInterface, 'push_tokens', 'fid', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await safeAddColumn(queryInterface, 'push_tokens', 'browser', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await safeAddColumn(queryInterface, 'push_tokens', 'device_label', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await safeAddColumn(queryInterface, 'push_tokens', 'permission_status', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'granted',
  });

  await safeAddColumn(queryInterface, 'push_tokens', 'is_active', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });

  // 2. Indexes for push_tokens
  await safeAddIndex(queryInterface, 'push_tokens', ['user_id', 'is_active'], {
    name: 'push_tokens_user_active_idx',
  });

  // 3. Composite performance index on notifications (user_id, read_at, created_at)
  await safeAddIndex(queryInterface, 'notifications', ['user_id', 'read_at', 'created_at'], {
    name: 'notifications_user_read_created_idx',
  });
}

export async function down(queryInterface) {
  try { await queryInterface.removeIndex('notifications', 'notifications_user_read_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('push_tokens', 'push_tokens_user_active_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('push_tokens', 'is_active'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('push_tokens', 'permission_status'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('push_tokens', 'device_label'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('push_tokens', 'browser'); } catch { /* ignore */ }
  try { await queryInterface.removeColumn('push_tokens', 'fid'); } catch { /* ignore */ }
}
