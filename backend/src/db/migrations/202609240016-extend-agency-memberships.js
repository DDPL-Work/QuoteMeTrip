/**
 * Migration: extend `agency_memberships` and `agency_profiles` for manual
 * payment confirmation, expanded membership lifecycle, and agreement tracking.
 */
export async function up(queryInterface, Sequelize) {
  // 1. Add manual payment and agreement columns to `agency_memberships`
  await queryInterface.addColumn('agency_memberships', 'confirmed_by', {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  await queryInterface.addColumn('agency_memberships', 'confirmed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn('agency_memberships', 'payment_reference', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
  await queryInterface.addColumn('agency_memberships', 'notes', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('agency_memberships', 'agreement_accepted', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await queryInterface.addColumn('agency_memberships', 'agreement_accepted_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn('agency_memberships', 'agreement_version', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  // Modify `status` column ENUM on `agency_memberships` to include pending & suspended
  await queryInterface.changeColumn('agency_memberships', 'status', {
    type: Sequelize.ENUM('pending', 'active', 'expired', 'suspended', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  });

  // 2. Add agreement columns to `agency_profiles`
  await queryInterface.addColumn('agency_profiles', 'agreement_accepted', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await queryInterface.addColumn('agency_profiles', 'agreement_accepted_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn('agency_profiles', 'agreement_version', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('agency_profiles', 'agreement_version');
  await queryInterface.removeColumn('agency_profiles', 'agreement_accepted_at');
  await queryInterface.removeColumn('agency_profiles', 'agreement_accepted');

  await queryInterface.changeColumn('agency_memberships', 'status', {
    type: Sequelize.ENUM('active', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  });

  await queryInterface.removeColumn('agency_memberships', 'agreement_version');
  await queryInterface.removeColumn('agency_memberships', 'agreement_accepted_at');
  await queryInterface.removeColumn('agency_memberships', 'agreement_accepted');
  await queryInterface.removeColumn('agency_memberships', 'notes');
  await queryInterface.removeColumn('agency_memberships', 'payment_reference');
  await queryInterface.removeColumn('agency_memberships', 'confirmed_at');
  await queryInterface.removeColumn('agency_memberships', 'confirmed_by');
}
