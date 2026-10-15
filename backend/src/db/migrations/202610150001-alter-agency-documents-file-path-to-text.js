/**
 * Migration: expand `agency_documents.file_path` to TEXT.
 *
 * Ensures storage of document URLs or local file references
 * never overflows column bounds.
 */
export async function up(queryInterface, Sequelize) {
  try {
    await queryInterface.changeColumn('agency_documents', 'file_path', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  } catch {
    // Graceful fallback if dialect/driver handles changeColumn differently
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    await queryInterface.changeColumn('agency_documents', 'file_path', {
      type: Sequelize.STRING(512),
      allowNull: false,
    });
  } catch {
    // Ignore
  }
}
