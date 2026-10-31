/**
 * Additive Migration: Create announcements table (Phase 7.5 / Workstream 3)
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

const TABLE_NAME = 'announcements';

const EXPECTED_COLUMNS = {
  id: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    typeMatch: /^VARCHAR\(255\)$/i,
    allowNull: false,
  },
  message: {
    typeMatch: /^TEXT$/i,
    allowNull: false,
  },
  target_audience: {
    typeMatch: /^ENUM\('all',\s*'travellers',\s*'agencies'\)$/i,
    allowNull: false,
    defaultValue: 'all',
  },
  type: {
    typeMatch: /^ENUM\('general',\s*'info',\s*'maintenance',\s*'important',\s*'urgent'\)$/i,
    allowNull: false,
    defaultValue: 'general',
  },
  priority: {
    typeMatch: /^ENUM\('low',\s*'normal',\s*'high',\s*'urgent'\)$/i,
    allowNull: false,
    defaultValue: 'normal',
  },
  action_label: {
    typeMatch: /^VARCHAR\(100\)$/i,
    allowNull: true,
  },
action_url: {
  typeMatch: /^VARCHAR\(500\)$/i,
  allowNull: true,
},
  status: {
    typeMatch: /^ENUM\('draft',\s*'published',\s*'archived',\s*'withdrawn'\)$/i,
    allowNull: false,
    defaultValue: 'draft',
  },
  title_tr: {
    typeMatch: /^VARCHAR\(255\)$/i,
    allowNull: true,
  },
  message_tr: {
    typeMatch: /^TEXT$/i,
    allowNull: true,
  },
  action_label_tr: {
    typeMatch: /^VARCHAR\(100\)$/i,
    allowNull: true,
  },
  expires_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: true,
  },
  published_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: true,
  },
  recipient_count: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    defaultValue: 0,
  },
  created_by: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
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
    columnName: 'created_by',
    referencedTableName: 'users',
    referencedColumnName: 'id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
];

const EXPECTED_INDEXES = [
  {
    name: 'announcements_status_idx',
    fields: ['status'],
    unique: false,
  },
  {
    name: 'announcements_target_audience_idx',
    fields: ['target_audience'],
    unique: false,
  },
  {
    name: 'announcements_published_at_idx',
    fields: ['published_at'],
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
