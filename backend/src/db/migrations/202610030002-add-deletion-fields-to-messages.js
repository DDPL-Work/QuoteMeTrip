/**
 * Migration: add deletion fields (`deleted_for_everyone_at`, `deleted_by_user_id`, `deleted_for_users`) to `messages`.
 */
export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('messages');
  if (!table.deleted_for_everyone_at) {
    await queryInterface.addColumn('messages', 'deleted_for_everyone_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
  if (!table.deleted_by_user_id) {
    await queryInterface.addColumn('messages', 'deleted_by_user_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }
  if (!table.deleted_for_users) {
    await queryInterface.addColumn('messages', 'deleted_for_users', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable('messages');
  if (table.deleted_for_everyone_at) {
    await queryInterface.removeColumn('messages', 'deleted_for_everyone_at');
  }
  if (table.deleted_by_user_id) {
    await queryInterface.removeColumn('messages', 'deleted_by_user_id');
  }
  if (table.deleted_for_users) {
    await queryInterface.removeColumn('messages', 'deleted_for_users');
  }
}
