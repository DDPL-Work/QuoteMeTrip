/**
 * Additive Migration: Create translation_cache table
 *
 * Implements production-safe idempotency, schema validation, duplicate key
 * detection, and partial recovery.
 */
import {
  tableExists,
  validateExistingColumns,
  ensureIndex,
} from '../migration-helpers.js';

const TABLE_NAME = 'translation_cache';

const EXPECTED_COLUMNS = {
  id: {
    typeMatch: /^INT(?:EGER)?\s*UNSIGNED$/i,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  cache_key: {
    typeMatch: /^VARCHAR\(255\)$/i,
    allowNull: false,
  },
  content_type: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
  },
  content_id: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
  },
  field_name: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
  },
  source_language: {
    typeMatch: /^VARCHAR\(16\)$/i,
    allowNull: false,
  },
  target_language: {
    typeMatch: /^VARCHAR\(16\)$/i,
    allowNull: false,
  },
  source_content_hash: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
  },
  translated_text: {
    typeMatch: /^MEDIUMTEXT$/i,
    allowNull: false,
  },
  translation_provider: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
    defaultValue: 'google_cloud_v3',
  },
  translation_version: {
    typeMatch: /^VARCHAR\(64\)$/i,
    allowNull: false,
    defaultValue: 'v1',
  },
  scope: {
    typeMatch: /^VARCHAR\(32\)$/i,
    allowNull: false,
    defaultValue: 'public',
  },
  created_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: false,
  },
  updated_at: {
    typeMatch: /^DATETIME$/i,
    allowNull: false,
  },
};

const EXPECTED_INDEXES = [
  {
    name: 'translation_cache_cache_key_unique',
    fields: ['cache_key'],
    unique: true,
    checkDuplicates: async (sequelize) => {
      // 1. Separate COUNT query for the total number of duplicate groups
      const [countRows] = await sequelize.query(`
        SELECT COUNT(*) AS total_groups
        FROM (
          SELECT \`cache_key\`
          FROM \`translation_cache\`
          GROUP BY \`cache_key\`
          HAVING COUNT(*) > 1
        ) AS dup_groups
      `);
      const totalGroups = Number(countRows[0]?.total_groups || 0);

      if (totalGroups > 0) {
        // 2. Retrieve a maximum of 10 sample duplicate groups using SQL LIMIT 10
        const sampleLimit = 10;
        const [sampleRows] = await sequelize.query(`
          SELECT \`cache_key\`, COUNT(*) AS count
          FROM \`translation_cache\`
          GROUP BY \`cache_key\`
          HAVING count > 1
          ORDER BY count DESC, \`cache_key\` ASC
          LIMIT 10
        `);

        const samples = sampleRows
          .map((d) => `"${d.cache_key}" (${d.count} occurrences)`)
          .join(', ');
        const overflow =
          totalGroups > sampleLimit
            ? ` (and ${totalGroups - sampleLimit} more duplicate groups)`
            : '';
        throw new Error(
          `Migration validation failed for table "${TABLE_NAME}": cannot create unique index "translation_cache_cache_key_unique" because ${totalGroups} duplicate cache_key group(s) exist: ${samples}${overflow}. Manual inspection is required; records will not be deleted.`
        );
      }
    },
  },
  {
    name: 'translation_cache_lookup_idx',
    fields: ['content_type', 'content_id', 'field_name', 'target_language'],
    unique: false,
  },
  {
    name: 'translation_cache_source_hash_idx',
    fields: ['source_content_hash'],
    unique: false,
  },
];

export async function up(queryInterface, Sequelize) {
  const exists = await tableExists(queryInterface, TABLE_NAME);

  if (!exists) {
    await queryInterface.createTable(TABLE_NAME, {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      cache_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content_type: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      content_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      field_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      source_language: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      target_language: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      source_content_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      translated_text: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
      translation_provider: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'google_cloud_v3',
      },
      translation_version: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'v1',
      },
      scope: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'public',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  } else {
    await validateExistingColumns(queryInterface, TABLE_NAME, EXPECTED_COLUMNS);
  }

  // Idempotently verify and create indexes individually
  for (const idx of EXPECTED_INDEXES) {
    await ensureIndex(queryInterface, TABLE_NAME, idx, idx.checkDuplicates);
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable(TABLE_NAME);
}
