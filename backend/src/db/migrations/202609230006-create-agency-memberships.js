/**
 * Migration: create `agency_memberships` (agency <-> plan link table).
 * `plan_id` uses RESTRICT so plans referenced by membership history
 * cannot be deleted; deactivate them instead.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('agency_memberships', {
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
    plan_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'membership_plans', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    starts_at: { type: Sequelize.DATE, allowNull: false },
    ends_at: { type: Sequelize.DATE, allowNull: true },
    status: {
      type: Sequelize.ENUM('active', 'expired', 'cancelled'),
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

  await queryInterface.addIndex('agency_memberships', ['agency_id'], {
    name: 'agency_memberships_agency_id_idx',
  });
  await queryInterface.addIndex('agency_memberships', ['plan_id'], {
    name: 'agency_memberships_plan_id_idx',
  });
  await queryInterface.addIndex('agency_memberships', ['status'], {
    name: 'agency_memberships_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('agency_memberships');
}
