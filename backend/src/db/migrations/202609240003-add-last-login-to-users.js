/**
 * Migration: add `last_login_at` to `users` (login auditing).
 * Only genuinely required auth fields are added — email verification
 * and password-change workflows are deferred to their own phases.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'last_login_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'last_login_at');
}
