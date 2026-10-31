/**
 * Additive Migration: Create password_resets table
 *
 * Implements production-safe idempotency, schema validation, foreign-key
 * verification, and partial recovery.
 */
import {
  tableExists,
  validateExistingColumns,
  validateExistingForeignKeys,
  ensureIndex,
} from '../migration-helpers.js';

const TABLE_NAME = 'password_resets';

const EXPECTED_COLUMNS = {
  id: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
  },
  purpose: {
    typeMatch: /^ENUM\('password_reset'\)$/i,
    allowNull: false,
    defaultValue: 'password_reset',
  },
  otp_hash: {
    typeMatch: /^CHAR\(64\)$/i,
    allowNull: false,
  },
  reset_token_hash: {
    typeMatch: /^CHAR\(64\)$/i,
    allowNull: true,
  },
  attempts: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    defaultValue: 0,
  },
  max_attempts: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    defaultValue: 5,
  },
  expires_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: false,
  },
  verified_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: true,
  },
  consumed_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: true,
  },
  ip_address: {
    typeMatch: /^VARCHAR\(45\)$/i,
    allowNull: true,
  },
  user_agent: {
    typeMatch: /^VARCHAR\(255\)$/i,
    allowNull: true,
  },
  created_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    onUpdate: null,
  },
  updated_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  },
};

const EXPECTED_FOREIGN_KEYS = [
  {
    columnName: 'user_id',
    referencedTableName: 'users',
    referencedColumnName: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
];

const EXPECTED_INDEXES = [
  {
    name: 'password_resets_user_id_idx',
    fields: ['user_id'],
    unique: false,
  },
  {
    name: 'password_resets_expires_at_idx',
    fields: ['expires_at'],
    unique: false,
  },
  {
    name: 'password_resets_reset_token_hash_idx',
    fields: ['reset_token_hash'],
    unique: false,
  },
];

export async function up(queryInterface, Sequelize) {
  const exists = await tableExists(queryInterface, TABLE_NAME);

  if (!exists) {
    await queryInterface.createTable(TABLE_NAME, {
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
  } else {
    await validateExistingColumns(queryInterface, TABLE_NAME, EXPECTED_COLUMNS);
    await validateExistingForeignKeys(queryInterface.sequelize, TABLE_NAME, EXPECTED_FOREIGN_KEYS);
  }

  // Idempotently verify and create indexes individually
  for (const idx of EXPECTED_INDEXES) {
    await ensureIndex(queryInterface, TABLE_NAME, idx);
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable(TABLE_NAME);
}
