/**
 * Migration: create `agency_documents` (N:1 under `agency_profiles`).
 * `verified_by` references `users(id)` with SET NULL so the audit
 * trail survives administrator removal.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('agency_documents', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    agency_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'agency_profiles', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    document_type: {
      type: Sequelize.ENUM('license', 'tax_certificate', 'identity', 'address_proof', 'other'),
      allowNull: false,
    },
    file_path: { type: Sequelize.STRING(512), allowNull: false },
    original_name: { type: Sequelize.STRING(255), allowNull: true },
    mime_type: { type: Sequelize.STRING(100), allowNull: true },
    file_size: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    verified_by: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    verified_at: { type: Sequelize.DATE, allowNull: true },
    verification_note: { type: Sequelize.TEXT, allowNull: true },
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

  await queryInterface.addIndex('agency_documents', ['agency_id'], {
    name: 'agency_documents_agency_id_idx',
  });
  await queryInterface.addIndex('agency_documents', ['status'], {
    name: 'agency_documents_status_idx',
  });
  await queryInterface.addIndex('agency_documents', ['document_type'], {
    name: 'agency_documents_document_type_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('agency_documents');
}
