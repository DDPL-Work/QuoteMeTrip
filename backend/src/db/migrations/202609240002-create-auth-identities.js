/**
 * Migration: create `auth_identities` (social provider linkage).
 * The composite unique constraint guarantees one local user per
 * provider identity.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('auth_identities', {
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
    provider: { type: Sequelize.STRING(30), allowNull: false },
    provider_user_id: { type: Sequelize.STRING(255), allowNull: false },
    provider_email: { type: Sequelize.STRING(190), allowNull: true },
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

  await queryInterface.addIndex('auth_identities', ['user_id'], {
    name: 'auth_identities_user_id_idx',
  });
  await queryInterface.addIndex('auth_identities', ['provider', 'provider_user_id'], {
    unique: true,
    name: 'auth_identities_provider_identity_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('auth_identities');
}
