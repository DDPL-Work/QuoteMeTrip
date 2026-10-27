/**
 * Additive Migration: Create password_resets table
 *
 * Dedicated storage for secure hashed email OTP challenges,
 * failed attempt counters, expiration, single-use reset authorization tokens.
 */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('password_resets', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    purpose: {
      type: Sequelize.ENUM('password_reset'),
      allowNull: false,
      defaultValue: 'password_reset',
    },
    otp_hash: {
      type: Sequelize.CHAR(64),
      allowNull: false,
    },
    reset_token_hash: {
      type: Sequelize.CHAR(64),
      allowNull: true,
    },
    attempts: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    max_attempts: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    verified_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    consumed_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    ip_address: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: Sequelize.STRING(255),
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('password_resets', ['user_id'], {
    name: 'password_resets_user_id_idx',
  });
  await queryInterface.addIndex('password_resets', ['expires_at'], {
    name: 'password_resets_expires_at_idx',
  });
  await queryInterface.addIndex('password_resets', ['reset_token_hash'], {
    name: 'password_resets_reset_token_hash_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('password_resets');
}
