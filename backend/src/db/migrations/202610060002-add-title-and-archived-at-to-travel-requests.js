/**
 * Migration: add `title` and `archived_at` to `travel_requests`.
 *
 * Supports:
 * - Human-readable custom trip title if provided by user
 * - Safe soft-delete / archive semantics for traveller requests
 */
export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('travel_requests');
  if (!table.title) {
    await queryInterface.addColumn('travel_requests', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }

  if (!table.archived_at) {
    await queryInterface.addColumn('travel_requests', 'archived_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }

  try {
    await queryInterface.addIndex('travel_requests', ['traveller_id', 'archived_at'], {
      name: 'travel_requests_traveller_archived_idx',
    });
  } catch {
    // Index may exist in idempotency test
  }
}

export async function down(queryInterface) {
  try {
    await queryInterface.removeIndex('travel_requests', 'travel_requests_traveller_archived_idx');
  } catch {
    // Ignore if not present
  }
  try {
    await queryInterface.removeColumn('travel_requests', 'archived_at');
  } catch {
    // Ignore if not present
  }
  try {
    await queryInterface.removeColumn('travel_requests', 'title');
  } catch {
    // Ignore if not present
  }
}
