/**
 * Migration: create `users` (foundational identity table).
 * Email uniqueness is enforced at the database level.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: Sequelize.STRING(120), allowNull: false },
    email: { type: Sequelize.STRING(190), allowNull: false },
    password_hash: { type: Sequelize.STRING(255), allowNull: true },
    role: {
      type: Sequelize.ENUM('traveller', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'traveller',
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'suspended'),
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

  await queryInterface.addIndex('users', ['email'], {
    unique: true,
    name: 'users_email_unique',
  });
  await queryInterface.addIndex('users', ['role'], { name: 'users_role_idx' });
  await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('users');
}
