/**
 * Migration: create `audit_logs` table for administrative audit tracking.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('audit_logs', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    actor_user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    action: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    entity_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    before_state: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    after_state: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    ip_address: {
      type: Sequelize.STRING(45),
      allowNull: true,
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

  await queryInterface.addIndex('audit_logs', ['actor_user_id'], {
    name: 'audit_logs_actor_user_id_idx',
  });
  await queryInterface.addIndex('audit_logs', ['action'], {
    name: 'audit_logs_action_idx',
  });
  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
    name: 'audit_logs_entity_type_entity_id_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('audit_logs');
}
