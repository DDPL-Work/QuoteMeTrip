/**
 * Additive Migration: Create announcements table (Phase 7.5 / Workstream 3)
 *
 * Dedicated admin announcement and notice broadcasting store.
 * Retains existing notifications table and cascades/sets null cleanly.
 */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('announcements', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    target_audience: {
      type: Sequelize.ENUM('all', 'travellers', 'agencies'),
      allowNull: false,
      defaultValue: 'all',
    },
    type: {
      type: Sequelize.ENUM('general', 'info', 'maintenance', 'important', 'urgent'),
      allowNull: false,
      defaultValue: 'general',
    },
    priority: {
      type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    action_label: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    action_url: {
      type: Sequelize.STRING(500),
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('draft', 'published', 'archived', 'withdrawn'),
      allowNull: false,
      defaultValue: 'draft',
    },
    title_tr: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    message_tr: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    action_label_tr: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    published_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    recipient_count: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('announcements', ['status']);
  await queryInterface.addIndex('announcements', ['target_audience']);
  await queryInterface.addIndex('announcements', ['published_at']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('announcements');
}
