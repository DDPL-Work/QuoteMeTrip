/**
 * Migration: Add composite database indexes for high-frequency filters,
 * pagination, messaging, notifications, travel requests, and jobs.
 */
async function safeAddIndex(queryInterface, tableName, attributes, options) {
  try {
    await queryInterface.addIndex(tableName, attributes, options);
  } catch (err) {
    if (err.original?.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_KEYNAME') {
      return; // Index already exists, ignore
    }
    throw err;
  }
}

export async function up(queryInterface, Sequelize) {
  // 1. travel_requests
  await safeAddIndex(queryInterface, 'travel_requests', ['traveller_id', 'status', 'created_at'], {
    name: 'travel_requests_traveller_status_created_idx',
  });
  await safeAddIndex(queryInterface, 'travel_requests', ['status', 'created_at'], {
    name: 'travel_requests_status_created_idx',
  });

  // 2. quotations
  await safeAddIndex(queryInterface, 'quotations', ['travel_request_id', 'status'], {
    name: 'quotations_request_status_idx',
  });
  await safeAddIndex(queryInterface, 'quotations', ['agency_id', 'status', 'created_at'], {
    name: 'quotations_agency_status_created_idx',
  });

  // 3. conversations
  await safeAddIndex(queryInterface, 'conversations', ['traveller_id', 'agency_id'], {
    name: 'conversations_traveller_agency_idx',
  });
  await safeAddIndex(queryInterface, 'conversations', ['updated_at'], {
    name: 'conversations_updated_at_idx',
  });

  // 4. messages
  await safeAddIndex(queryInterface, 'messages', ['conversation_id', 'created_at'], {
    name: 'messages_conversation_created_idx',
  });

  // 5. notifications
  await safeAddIndex(queryInterface, 'notifications', ['user_id', 'status', 'created_at'], {
    name: 'notifications_user_status_created_idx',
  });

  // 6. jobs
  await safeAddIndex(queryInterface, 'jobs', ['agency_id', 'status', 'created_at'], {
    name: 'jobs_agency_status_created_idx',
  });
  await safeAddIndex(queryInterface, 'jobs', ['traveller_id', 'status', 'created_at'], {
    name: 'jobs_traveller_status_created_idx',
  });

  // 7. agency_documents
  await safeAddIndex(queryInterface, 'agency_documents', ['agency_id', 'status', 'document_type'], {
    name: 'agency_documents_agency_status_type_idx',
  });
}

export async function down(queryInterface) {
  try { await queryInterface.removeIndex('agency_documents', 'agency_documents_agency_status_type_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('jobs', 'jobs_traveller_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('jobs', 'jobs_agency_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('notifications', 'notifications_user_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('conversations', 'conversations_updated_at_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('conversations', 'conversations_traveller_agency_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('quotations', 'quotations_agency_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('quotations', 'quotations_request_status_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('travel_requests', 'travel_requests_status_created_idx'); } catch { /* ignore */ }
  try { await queryInterface.removeIndex('travel_requests', 'travel_requests_traveller_status_created_idx'); } catch { /* ignore */ }
}
