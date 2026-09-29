/**
 * Migration: create `auth_sessions` (refresh-session storage).
 * Only token hashes are stored — never raw refresh tokens.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('auth_sessions', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    token_hash: { type: Sequelize.CHAR(64), allowNull: false },
    token_family: { type: Sequelize.CHAR(36), allowNull: false },
    expires_at: { type: Sequelize.DATE, allowNull: false },
    revoked_at: { type: Sequelize.DATE, allowNull: true },
    replaced_by_session_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'auth_sessions', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    ip_address: { type: Sequelize.STRING(45), allowNull: true },
    user_agent: { type: Sequelize.STRING(512), allowNull: true },
    last_used_at: { type: Sequelize.DATE, allowNull: true },
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

  await queryInterface.addIndex('auth_sessions', ['user_id'], {
    name: 'auth_sessions_user_id_idx',
  });
  await queryInterface.addIndex('auth_sessions', ['token_hash'], {
    unique: true,
    name: 'auth_sessions_token_hash_unique',
  });
  await queryInterface.addIndex('auth_sessions', ['token_family'], {
    name: 'auth_sessions_token_family_idx',
  });
  await queryInterface.addIndex('auth_sessions', ['expires_at'], {
    name: 'auth_sessions_expires_at_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('auth_sessions');
}
