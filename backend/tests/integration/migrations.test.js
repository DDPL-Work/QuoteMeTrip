/**
 * Migration tests (Phase 2 + Recovery & Idempotency Suite).
 *
 * Verifies against a FRESH test database:
 *   drop everything -> migrate up -> schema exists
 *   -> migrate down -> schema reverts
 *   -> migrate up again -> schema restored
 *   -> deep recovery and safety tests
 *
 * Leaves the test database fully migrated for the other suites.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { before, describe, test, after } from 'node:test';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { isLoopbackHost } from '../../src/config/database.js';
import { migrateUp, migrateDown } from '../../src/db/runner.js';

import * as translationCacheMigration from '../../src/db/migrations/202610230001-create-translation-cache.js';
import * as announcementsMigration from '../../src/db/migrations/202610260001-create-announcements.js';
import * as passwordResetsMigration from '../../src/db/migrations/202610270001-create-password-resets.js';
import * as seoFieldsMigration from '../../src/db/migrations/202610290001-add-seo-fields-to-travel-guide-articles.js';
import * as contentJsonMigration from '../../src/db/migrations/202610300001-add-content-json-to-travel-guide-articles.js';
import {
  validateExistingForeignKeys,
} from '../../src/db/migration-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../src/db/migrations');

async function getExpectedMigrationCount() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith('.js')).length;
}

const EXPECTED_TABLES = [
  'users',
  'traveller_profiles',
  'agency_profiles',
  'agency_documents',
  'membership_plans',
  'agency_memberships',
  // Phase 3 — authentication, identity & RBAC.
  'auth_sessions',
  'auth_identities',
  // Phase 4 — traveller core workflow (routes + travel requests).
  'routes',
  'route_stops',
  'travel_requests',
  'travel_request_days',
  // Phase 5 — agency matching + quotations.
  'travel_request_agencies',
  'quotations',
  'quotation_items',
  // Phase 5.3 — agency coverage and service capabilities.
  'agency_coverages',
  'agency_capabilities',
  // Phase 6 — messaging, acceptance & jobs.
  'conversations',
  'messages',
  'jobs',
  // Phase 7 — admin operations, commissions & audit logging.
  'commissions',
  'audit_logs',
  // Phase 7.5 — announcements & password resets.
  'announcements',
  'password_resets',
  // Phase 8 — notifications, weather, travel guide & ratings.
  'notifications',
  'push_tokens',
  'weather_cache',
  'travel_guide_regions',
  'travel_guide_destinations',
  'travel_guide_articles',
  'ratings',
  'translation_cache',
];

let db;
let expectedMigrationCount = 0;

async function dropEverything() {
  const dbName = db.config.database;
  const host = db.config.host;

  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`Refusing to drop tables: NODE_ENV is "${process.env.NODE_ENV}", must be "test"`);
  }
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(`Refusing to drop tables: database "${dbName}" does not end with "_test"`);
  }
  if (!isLoopbackHost(host)) {
    throw new Error(`Refusing to drop tables: host "${host}" is not a verified loopback address`);
  }

  const qi = db.getQueryInterface();
  const tables = await qi.showAllTables();
  const tableNames = tables
    .map((t) => (typeof t === 'string' ? t : t.tableName || t.name))
    .flat()
    .filter(Boolean);

  if (tableNames.length === 0) {
    return;
  }

  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of tableNames) {
      await qi.dropTable(table);
    }
  } finally {
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function listTables() {
  const tables = await db.getQueryInterface().showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).sort();
}

before(async () => {
  expectedMigrationCount = await getExpectedMigrationCount();
  assert.ok(expectedMigrationCount > 0, 'Expected at least one migration file to exist');

  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for migration tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  await dropEverything();
});

after(async () => {
  await closeDatabase();
  resetSequelizeInstance();
});

describe('Phase 2 + Phase 3 + Phase 4 + Phase 5 migrations', () => {
  test('migrate up creates all foundation tables', async () => {
    const applied = await migrateUp(db);
    assert.strictEqual(applied.length, expectedMigrationCount);

    const tables = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tables.includes(table), `table ${table} should exist`);
    }

    const [meta] = await db.query('SELECT COUNT(*) AS count FROM `SequelizeMeta`');
    assert.strictEqual(Number(meta[0].count), expectedMigrationCount);

    const [indexes] = await db.query('SHOW INDEX FROM `users`');
    const names = indexes.map((idx) => idx.Key_name);
    assert.ok(names.includes('users_email_unique'), 'unique email index should exist');

    const [sessionColumns] = await db.query('SHOW COLUMNS FROM `auth_sessions`');
    const sessionFields = sessionColumns.map((col) => col.Field);
    for (const field of [
      'user_id',
      'token_hash',
      'token_family',
      'expires_at',
      'revoked_at',
      'replaced_by_session_id',
      'ip_address',
      'user_agent',
      'last_used_at',
    ]) {
      assert.ok(sessionFields.includes(field), `auth_sessions.${field} should exist`);
    }
    const [sessionIndexes] = await db.query('SHOW INDEX FROM `auth_sessions`');
    const sessionIndexNames = sessionIndexes.map((idx) => idx.Key_name);
    assert.ok(
      sessionIndexNames.includes('auth_sessions_token_hash_unique'),
      'unique token-hash index should exist',
    );

    const [identityIndexes] = await db.query('SHOW INDEX FROM `auth_identities`');
    const identityIndexNames = identityIndexes.map((idx) => idx.Key_name);
    assert.ok(
      identityIndexNames.includes('auth_identities_provider_identity_unique'),
      'provider identity unique index should exist',
    );

    const [userColumns] = await db.query('SHOW COLUMNS FROM `users`');
    assert.ok(
      userColumns.some((col) => col.Field === 'last_login_at'),
      'users.last_login_at should exist',
    );
  });

  test('migrate up is idempotent (no pending work on re-run)', async () => {
    const applied = await migrateUp(db);
    assert.strictEqual(applied.length, 0);
  });

  test('migrate down reverts, migrate up restores', async () => {
    const reverted = await migrateDown(db, expectedMigrationCount);
    assert.strictEqual(reverted.length, expectedMigrationCount);

    const tablesAfterDown = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(!tablesAfterDown.includes(table), `table ${table} should be gone`);
    }

    const restored = await migrateUp(db);
    assert.strictEqual(restored.length, expectedMigrationCount);

    const tablesAfterUp = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tablesAfterUp.includes(table), `table ${table} should be back`);
    }
  });
});

describe('Production-Safe Migration Recovery & Idempotency Tests', () => {
  const qi = () => db.getQueryInterface();
  const Sequelize = () => db.constructor;

  test('1. Idempotent execution on existing compatible table preserves existing rows', async () => {
    await db.query(`
      INSERT INTO \`translation_cache\` (
        \`cache_key\`, \`content_type\`, \`content_id\`, \`field_name\`,
        \`source_language\`, \`target_language\`, \`source_content_hash\`,
        \`translated_text\`, \`translation_provider\`, \`translation_version\`,
        \`scope\`, \`created_at\`, \`updated_at\`
      ) VALUES (
        'preserve_test_key_1', 'article', '101', 'title',
        'en', 'tr', 'hash12345',
        'Korunmus Metin', 'google_cloud_v3', 'v1',
        'public', NOW(), NOW()
      )
    `);

    // Re-run migration.up() directly
    await translationCacheMigration.up(qi(), Sequelize());

    // Assert row was not altered or lost
    const [rows] = await db.query(
      'SELECT `translated_text` FROM `translation_cache` WHERE `cache_key` = ?',
      { replacements: ['preserve_test_key_1'] }
    );
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].translated_text, 'Korunmus Metin');

    // Clean up test row
    await db.query('DELETE FROM `translation_cache` WHERE `cache_key` = ?', {
      replacements: ['preserve_test_key_1'],
    });
  });

  test('2. Missing non-unique index recovery recreates only the missing index', async () => {
    const idxName = 'announcements_published_at_idx';
    await qi().removeIndex('announcements', idxName);

    const beforeIndexes = await qi().showIndex('announcements');
    assert.ok(!beforeIndexes.some((i) => i.name === idxName));

    // Re-run migration up
    await announcementsMigration.up(qi(), Sequelize());

    const afterIndexes = await qi().showIndex('announcements');
    const recreated = afterIndexes.find((i) => i.name === idxName);
    assert.ok(recreated, 'Index should be recreated');
    assert.strictEqual(recreated.fields[0].attribute, 'published_at');
    assert.strictEqual(Boolean(recreated.unique), false);
  });

  test('3. Missing unique index recovery recreates unique index safely', async () => {
    const idxName = 'translation_cache_cache_key_unique';
    await qi().removeIndex('translation_cache', idxName);

    const beforeIndexes = await qi().showIndex('translation_cache');
    assert.ok(!beforeIndexes.some((i) => i.name === idxName));

    // Re-run migration up
    await translationCacheMigration.up(qi(), Sequelize());

    const afterIndexes = await qi().showIndex('translation_cache');
    const recreated = afterIndexes.find((i) => i.name === idxName);
    assert.ok(recreated, 'Unique index should be recreated');
    assert.strictEqual(recreated.fields[0].attribute, 'cache_key');
    assert.strictEqual(Boolean(recreated.unique), true);
  });

  test('4. Duplicate key detection aborts unique index creation without modifying data', async () => {
    const idxName = 'translation_cache_cache_key_unique';
    const beforeIndexes = await qi().showIndex('translation_cache');
    if (beforeIndexes.some((i) => i.name === idxName)) {
      await qi().removeIndex('translation_cache', idxName);
    }

    const dupKey = 'dup_key_test_collision';
    await db.query(`
      INSERT INTO \`translation_cache\` (
        \`cache_key\`, \`content_type\`, \`content_id\`, \`field_name\`,
        \`source_language\`, \`target_language\`, \`source_content_hash\`,
        \`translated_text\`, \`created_at\`, \`updated_at\`
      ) VALUES
        ('${dupKey}', 'article', '1', 'title', 'en', 'tr', 'h1', 'Text 1', NOW(), NOW()),
        ('${dupKey}', 'article', '2', 'title', 'en', 'tr', 'h2', 'Text 2', NOW(), NOW())
    `);

    try {
      await assert.rejects(
        async () => {
          await translationCacheMigration.up(qi(), Sequelize());
        },
        /cannot create unique index "translation_cache_cache_key_unique" because \d+ duplicate cache_key group\(s\) exist/
      );

      // Assert records were preserved and NOT deleted automatically
      const [rows] = await db.query(
        'SELECT COUNT(*) as cnt FROM `translation_cache` WHERE `cache_key` = ?',
        { replacements: [dupKey] }
      );
      assert.strictEqual(Number(rows[0].cnt), 2);
    } finally {
      // Clean up duplicates and restore unique index
      await db.query('DELETE FROM `translation_cache` WHERE `cache_key` = ?', {
        replacements: [dupKey],
      });
      await translationCacheMigration.up(qi(), Sequelize());
    }
  });

  test('5. Rejects existing table with missing required column', async () => {
    await qi().removeColumn('announcements', 'title_tr');

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /required column "title_tr" is missing/
      );
    } finally {
      // Restore column
      await qi().addColumn('announcements', 'title_tr', {
        type: Sequelize().STRING(255),
        allowNull: true,
      });
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('6. Rejects existing table with incompatible column type', async () => {
    await db.query(
      'ALTER TABLE `announcements` MODIFY COLUMN `recipient_count` VARCHAR(50) NOT NULL'
    );

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /column "recipient_count" has incompatible type/
      );
    } finally {
      // Restore column
      await db.query(
        'ALTER TABLE `announcements` MODIFY COLUMN `recipient_count` INT UNSIGNED NOT NULL DEFAULT 0'
      );
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('7. Rejects existing index with mismatched columns or order', async () => {
    const idxName = 'announcements_status_idx';
    await qi().removeIndex('announcements', idxName);

    // Create mismatched index pointing to wrong column ('type')
    await qi().addIndex('announcements', ['type'], { name: idxName });

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /indexes columns \[type\] \(expected \[status\]\)/
      );
    } finally {
      // Clean up and restore valid index
      await qi().removeIndex('announcements', idxName);
      await qi().addIndex('announcements', ['status'], { name: idxName });
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('8. Foreign key validation detects missing referential constraint', async () => {
    const [fks] = await db.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'password_resets'
        AND COLUMN_NAME = 'user_id'
        AND REFERENCED_TABLE_NAME = 'users'
    `);
    assert.ok(fks.length > 0, 'FK should exist initially');
    const constraintName = fks[0].CONSTRAINT_NAME;

    await db.query(`ALTER TABLE \`password_resets\` DROP FOREIGN KEY \`${constraintName}\``);

    try {
      await assert.rejects(
        async () => {
          await passwordResetsMigration.up(qi(), Sequelize());
        },
        /missing foreign key constraint on "user_id" referencing "users\(id\)"/
      );
    } finally {
      // Restore foreign key
      await db.query(
        `ALTER TABLE \`password_resets\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
      );
      // Verify recovery succeeds after restoration
      await passwordResetsMigration.up(qi(), Sequelize());
    }
  });

  test('9. Correct default values and foreign keys after initial creation', async () => {
    const [cols] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (
          (TABLE_NAME = 'announcements' AND COLUMN_NAME IN ('status', 'recipient_count', 'created_at', 'updated_at'))
          OR (TABLE_NAME = 'translation_cache' AND COLUMN_NAME IN ('translation_provider', 'translation_version', 'scope'))
        )
    `);
    const colMap = new Map(cols.map((c) => [`${c.TABLE_NAME}.${c.COLUMN_NAME}`, c]));

    const statusCol = colMap.get('announcements.status');
    assert.strictEqual(statusCol.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'draft');

    const recipientCol = colMap.get('announcements.recipient_count');
    assert.strictEqual(Number(recipientCol.COLUMN_DEFAULT), 0);

    const createdAtCol = colMap.get('announcements.created_at');
    assert.match(createdAtCol.COLUMN_DEFAULT, /^CURRENT_TIMESTAMP(?:\(\))?$/i);
    assert.ok(!/on update/i.test(createdAtCol.EXTRA || ''));

    const updatedAtCol = colMap.get('announcements.updated_at');
    assert.match(updatedAtCol.COLUMN_DEFAULT, /^CURRENT_TIMESTAMP(?:\(\))?$/i);
    assert.match(updatedAtCol.EXTRA, /on update CURRENT_TIMESTAMP(?:\(\))?/i);

    // Verify translation_cache defaults
    const providerCol = colMap.get('translation_cache.translation_provider');
    assert.strictEqual(providerCol.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'google_cloud_v3');

    const versionCol = colMap.get('translation_cache.translation_version');
    assert.strictEqual(versionCol.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'v1');

    const scopeCol = colMap.get('translation_cache.scope');
    assert.strictEqual(scopeCol.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'public');

    // Verify foreign keys exist with correct rules
    const [fks] = await db.query(`
      SELECT
        kcu.TABLE_NAME AS tableName,
        kcu.COLUMN_NAME AS columnName,
        kcu.REFERENCED_TABLE_NAME AS referencedTableName,
        kcu.REFERENCED_COLUMN_NAME AS referencedColumnName,
        rc.DELETE_RULE AS onDelete,
        rc.UPDATE_RULE AS onUpdate
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
        AND kcu.TABLE_NAME = rc.TABLE_NAME
      WHERE kcu.TABLE_SCHEMA = DATABASE()
        AND kcu.TABLE_NAME IN ('announcements', 'password_resets')
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    `);

    const announceFk = fks.find((fk) => fk.tableName === 'announcements' && fk.columnName === 'created_by');
    assert.ok(announceFk, 'announcements.created_by FK must exist');
    assert.strictEqual(announceFk.referencedTableName, 'users');
    assert.strictEqual(announceFk.referencedColumnName, 'id');
    assert.strictEqual(announceFk.onDelete, 'SET NULL');
    assert.strictEqual(announceFk.onUpdate, 'CASCADE');

    const resetFk = fks.find((fk) => fk.tableName === 'password_resets' && fk.columnName === 'user_id');
    assert.ok(resetFk, 'password_resets.user_id FK must exist');
    assert.strictEqual(resetFk.referencedTableName, 'users');
    assert.strictEqual(resetFk.referencedColumnName, 'id');
    assert.strictEqual(resetFk.onDelete, 'CASCADE');
    assert.strictEqual(resetFk.onUpdate, 'CASCADE');
  });

  test('10. Rejects existing table with incorrect string or enum default value', async () => {
    await db.query("ALTER TABLE `announcements` ALTER COLUMN `status` SET DEFAULT 'published'");

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /column "status" defaultValue mismatch \(expected "draft", found "published"\)/
      );
    } finally {
      // Restore
      await db.query("ALTER TABLE `announcements` ALTER COLUMN `status` SET DEFAULT 'draft'");
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('11. Rejects existing table with incorrect numeric default value', async () => {
    await db.query('ALTER TABLE `announcements` ALTER COLUMN `recipient_count` SET DEFAULT 10');

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /column "recipient_count" defaultValue mismatch \(expected 0, found "10"\)/
      );
    } finally {
      // Restore
      await db.query('ALTER TABLE `announcements` ALTER COLUMN `recipient_count` SET DEFAULT 0');
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('12. Rejects existing table with incorrect timestamp default or missing on-update trigger', async () => {
    // Drop ON UPDATE CURRENT_TIMESTAMP from updated_at
    await db.query(
      'ALTER TABLE `announcements` MODIFY COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
    );

    try {
      await assert.rejects(
        async () => {
          await announcementsMigration.up(qi(), Sequelize());
        },
        /column "updated_at" onUpdate mismatch/
      );
    } finally {
      // Restore ON UPDATE CURRENT_TIMESTAMP
      await db.query(
        'ALTER TABLE `announcements` MODIFY COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      );
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('13. Foreign-key validation matches exact referenced table, column, and action rules', async () => {
    const [fks] = await db.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'password_resets'
        AND COLUMN_NAME = 'user_id'
        AND REFERENCED_TABLE_NAME = 'users'
    `);
    assert.ok(fks.length > 0);
    const constraintName = fks[0].CONSTRAINT_NAME;

    // Drop and re-add with RESTRICT instead of CASCADE
    await db.query(`ALTER TABLE \`password_resets\` DROP FOREIGN KEY \`${constraintName}\``);
    await db.query(
      `ALTER TABLE \`password_resets\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    try {
      await assert.rejects(
        async () => {
          await passwordResetsMigration.up(qi(), Sequelize());
        },
        /foreign key on "user_id" has ON DELETE RESTRICT \(expected CASCADE\)/
      );
    } finally {
      // Restore with CASCADE
      await db.query(`ALTER TABLE \`password_resets\` DROP FOREIGN KEY \`${constraintName}\``);
      await db.query(
        `ALTER TABLE \`password_resets\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
      );
      await passwordResetsMigration.up(qi(), Sequelize());
    }
  });

  test('14. Foreign-key validation discriminates multiple constraints without false matches', async () => {
    // Expected set containing one valid constraint and one pointing to the wrong table
    const expectedWithInvalid = [
      {
        columnName: 'user_id',
        referencedTableName: 'users',
        referencedColumnName: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      {
        columnName: 'user_id',
        referencedTableName: 'traveller_profiles',
        referencedColumnName: 'id',
      },
    ];

    await assert.rejects(
      async () => {
        await validateExistingForeignKeys(db, 'password_resets', expectedWithInvalid);
      },
      /missing foreign key constraint on "user_id" referencing "traveller_profiles\(id\)"/
    );
  });

  test('15. Bounded duplicate key error reporting limits samples to 10 and reports total group count', async () => {
    const idxName = 'translation_cache_cache_key_unique';
    const beforeIndexes = await qi().showIndex('translation_cache');
    if (beforeIndexes.some((i) => i.name === idxName)) {
      await qi().removeIndex('translation_cache', idxName);
    }

    // Insert 15 duplicate groups
    const values = [];
    for (let i = 1; i <= 15; i++) {
      const key = `bounded_dup_key_${String(i).padStart(2, '0')}`;
      values.push(
        `('${key}', 'article', '${i}', 'title', 'en', 'tr', 'hash_${i}', 'Text A ${i}', NOW(), NOW())`
      );
      values.push(
        `('${key}', 'article', '${i}', 'title', 'en', 'tr', 'hash_${i}', 'Text B ${i}', NOW(), NOW())`
      );
    }

    await db.query(`
      INSERT INTO \`translation_cache\` (
        \`cache_key\`, \`content_type\`, \`content_id\`, \`field_name\`,
        \`source_language\`, \`target_language\`, \`source_content_hash\`,
        \`translated_text\`, \`created_at\`, \`updated_at\`
      ) VALUES ${values.join(',\n')}
    `);

    try {
      await assert.rejects(
        async () => {
          await translationCacheMigration.up(qi(), Sequelize());
        },
        (err) => {
          assert.match(
            err.message,
            /cannot create unique index "translation_cache_cache_key_unique" because 15 duplicate cache_key group\(s\) exist:/
          );
          assert.match(err.message, /\(and 5 more duplicate groups\)/);
          // Confirm exactly 10 sample groups are presented in the message
          const matchSamples = err.message.match(/exist: (.*?) \(and \d+ more/);
          assert.ok(matchSamples, 'Should format samples and overflow suffix');
          const sampleCount = (matchSamples[1].match(/"bounded_dup_key_\d+"/g) || []).length;
          assert.strictEqual(sampleCount, 10, 'Must output exactly 10 sample groups');
          return true;
        }
      );

      // Verify no records were deleted
      const [rows] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `translation_cache` WHERE `cache_key` LIKE 'bounded_dup_key_%'"
      );
      assert.strictEqual(Number(rows[0].cnt), 30);
    } finally {
      // Clean up test rows
      await db.query("DELETE FROM `translation_cache` WHERE `cache_key` LIKE 'bounded_dup_key_%'");
      // Re-run migration up to ensure index is restored
      await translationCacheMigration.up(qi(), Sequelize());
    }
  });

  test('16. Rejects existing translation_cache with incorrect default values', async () => {
    // Test translation_provider default mismatch
    await db.query(
      "ALTER TABLE `translation_cache` ALTER COLUMN `translation_provider` SET DEFAULT 'custom_provider'"
    );

    try {
      await assert.rejects(
        async () => {
          await translationCacheMigration.up(qi(), Sequelize());
        },
        /column "translation_provider" defaultValue mismatch \(expected "google_cloud_v3", found "custom_provider"\)/
      );
    } finally {
      await db.query(
        "ALTER TABLE `translation_cache` ALTER COLUMN `translation_provider` SET DEFAULT 'google_cloud_v3'"
      );
      await translationCacheMigration.up(qi(), Sequelize());
    }

    // Test scope default mismatch
    await db.query("ALTER TABLE `translation_cache` ALTER COLUMN `scope` SET DEFAULT 'internal'");

    try {
      await assert.rejects(
        async () => {
          await translationCacheMigration.up(qi(), Sequelize());
        },
        /column "scope" defaultValue mismatch \(expected "public", found "internal"\)/
      );
    } finally {
      await db.query("ALTER TABLE `translation_cache` ALTER COLUMN `scope` SET DEFAULT 'public'");
      await translationCacheMigration.up(qi(), Sequelize());
    }
  });

  test('17. Foreign-key validation selects matching candidate when multiple constraints exist on same column', async () => {
    // Add a second constraint on announcements.created_by pointing to users(id) with ON DELETE CASCADE
    const tempConstraint = 'announcements_created_by_temp_fk';
    await db.query(`
      ALTER TABLE \`announcements\`
      ADD CONSTRAINT \`${tempConstraint}\`
      FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    try {
      // announcementsMigration expects ON DELETE SET NULL.
      // Even though a CASCADE candidate now exists on created_by, exactMatch finds the SET NULL candidate and succeeds.
      await announcementsMigration.up(qi(), Sequelize());

      // If we ask for ON DELETE RESTRICT (which neither candidate has), it rejects with the rule mismatch.
      await assert.rejects(
        async () => {
          await validateExistingForeignKeys(db, 'announcements', [
            {
              columnName: 'created_by',
              referencedTableName: 'users',
              referencedColumnName: 'id',
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE',
            },
          ]);
        },
        /foreign key on "created_by" has ON DELETE/
      );
    } finally {
      // Remove temporary constraint
      await db.query(`ALTER TABLE \`announcements\` DROP FOREIGN KEY \`${tempConstraint}\``);
      await announcementsMigration.up(qi(), Sequelize());
    }
  });

  test('18. Travel guide articles additive migrations: Fresh migration adds all expected columns', async () => {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'travel_guide_articles'
    `);
    const colMap = new Map(cols.map((c) => [c.COLUMN_NAME, c]));

    const expectedVarchars = [
      'cover_image_alt',
      'meta_title',
      'canonical_url',
      'og_title',
      'og_image',
      'focus_keyword',
    ];
    for (const name of expectedVarchars) {
      const col = colMap.get(name);
      assert.ok(col, `Column "${name}" must exist`);
      assert.strictEqual(col.DATA_TYPE, 'varchar');
      assert.strictEqual(col.IS_NULLABLE, 'YES');
    }

    const expectedTexts = ['meta_description', 'og_description', 'related_keywords'];
    for (const name of expectedTexts) {
      const col = colMap.get(name);
      assert.ok(col, `Column "${name}" must exist`);
      assert.strictEqual(col.DATA_TYPE, 'text');
      assert.strictEqual(col.IS_NULLABLE, 'YES');
    }

    // Check defaults on meta_robots and twitter_card
    const robots = colMap.get('meta_robots');
    assert.ok(robots);
    assert.strictEqual(robots.DATA_TYPE, 'varchar');
    assert.strictEqual(robots.IS_NULLABLE, 'YES');
    assert.strictEqual(robots.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'index, follow');

    const twitter = colMap.get('twitter_card');
    assert.ok(twitter);
    assert.strictEqual(twitter.DATA_TYPE, 'varchar');
    assert.strictEqual(twitter.IS_NULLABLE, 'YES');
    assert.strictEqual(twitter.COLUMN_DEFAULT.replace(/^['"]|['"]$/g, ''), 'summary_large_image');

    // Check content_json
    const contentJson = colMap.get('content_json');
    assert.ok(contentJson);
    assert.strictEqual(contentJson.DATA_TYPE, 'json');
    assert.strictEqual(contentJson.IS_NULLABLE, 'YES');
  });

  test('19. Travel guide articles additive migrations: Re-running migration preserves existing values', async () => {
    const slug = 'test-seo-persistence-article';
    await db.query(`
      INSERT INTO \`travel_guide_articles\` (
        \`title\`, \`slug\`, \`content\`, \`status\`, \`cover_image_alt\`, \`meta_title\`,
        \`meta_robots\`, \`twitter_card\`, \`content_json\`, \`created_at\`, \`updated_at\`
      ) VALUES (
        'Test SEO Article', '${slug}', 'Body content', 'draft',
        'Custom Alt Text', 'Custom Meta Title', 'noindex, follow', 'summary',
        '{"type":"doc","content":[]}', NOW(), NOW()
      )
    `);

    try {
      // Re-run both migrations
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());

      // Assert row data was preserved and not overwritten
      const [rows] = await db.query(
        'SELECT `cover_image_alt`, `meta_title`, `meta_robots`, `twitter_card`, `content_json` FROM `travel_guide_articles` WHERE `slug` = ?',
        { replacements: [slug] }
      );
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].cover_image_alt, 'Custom Alt Text');
      assert.strictEqual(rows[0].meta_title, 'Custom Meta Title');
      assert.strictEqual(rows[0].meta_robots, 'noindex, follow');
      assert.strictEqual(rows[0].twitter_card, 'summary');

      const jsonVal = typeof rows[0].content_json === 'string'
        ? JSON.parse(rows[0].content_json)
        : rows[0].content_json;
      assert.deepStrictEqual(jsonVal, { type: 'doc', content: [] });
    } finally {
      await db.query('DELETE FROM `travel_guide_articles` WHERE `slug` = ?', {
        replacements: [slug],
      });
    }
  });

  test('20. Travel guide articles additive migrations: Compatible existing columns are accepted', async () => {
    // Re-running up when all columns exist and match specifications should succeed idempotently
    await seoFieldsMigration.up(qi(), Sequelize());
    await contentJsonMigration.up(qi(), Sequelize());
  });

  test('21. Travel guide articles additive migrations: Incompatible existing column types are rejected', async () => {
    // Test incompatible meta_title (change to INT)
    await db.query('ALTER TABLE `travel_guide_articles` MODIFY COLUMN `meta_title` INT NULL');

    try {
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /column "meta_title" has incompatible type/
      );
    } finally {
      await db.query('ALTER TABLE `travel_guide_articles` MODIFY COLUMN `meta_title` VARCHAR(255) NULL');
      await seoFieldsMigration.up(qi(), Sequelize());
    }

    // Test incompatible content_json (change to VARCHAR(100))
    await db.query('ALTER TABLE `travel_guide_articles` MODIFY COLUMN `content_json` VARCHAR(100) NULL');

    try {
      await assert.rejects(
        async () => {
          await contentJsonMigration.up(qi(), Sequelize());
        },
        /column "content_json" has incompatible type/
      );
    } finally {
      await db.query('ALTER TABLE `travel_guide_articles` MODIFY COLUMN `content_json` JSON NULL');
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('22. Travel guide articles additive migrations: Incorrect defaults are rejected', async () => {
    // Test incorrect meta_robots default
    await db.query("ALTER TABLE `travel_guide_articles` ALTER COLUMN `meta_robots` SET DEFAULT 'none'");

    try {
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /column "meta_robots" defaultValue mismatch \(expected "index, follow", found "none"\)/
      );
    } finally {
      await db.query("ALTER TABLE `travel_guide_articles` ALTER COLUMN `meta_robots` SET DEFAULT 'index, follow'");
      await seoFieldsMigration.up(qi(), Sequelize());
    }

    // Test incorrect twitter_card default
    await db.query("ALTER TABLE `travel_guide_articles` ALTER COLUMN `twitter_card` SET DEFAULT 'app'");

    try {
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /column "twitter_card" defaultValue mismatch \(expected "summary_large_image", found "app"\)/
      );
    } finally {
      await db.query("ALTER TABLE `travel_guide_articles` ALTER COLUMN `twitter_card` SET DEFAULT 'summary_large_image'");
      await seoFieldsMigration.up(qi(), Sequelize());
    }
  });

  test('23. Travel guide articles additive migrations: Partial execution can recover', async () => {
    // Drop the last 4 SEO columns to simulate partial execution failure after column 7
    await db.query(`
      ALTER TABLE \`travel_guide_articles\`
        DROP COLUMN \`og_image\`,
        DROP COLUMN \`twitter_card\`,
        DROP COLUMN \`focus_keyword\`,
        DROP COLUMN \`related_keywords\`
    `);
    await db.query(`
      DELETE FROM \`_migration_column_ownership\`
      WHERE \`migration_name\` = '202610290001-add-seo-fields-to-travel-guide-articles'
        AND \`column_name\` IN ('og_image', 'twitter_card', 'focus_keyword', 'related_keywords')
    `);

    try {
      // Re-run migration.up() — should validate existing 7 columns and add missing 4 columns
      await seoFieldsMigration.up(qi(), Sequelize());

      const cols = await qi().describeTable('travel_guide_articles');
      assert.ok(cols.og_image, 'og_image should be recovered');
      assert.ok(cols.twitter_card, 'twitter_card should be recovered');
      assert.ok(cols.focus_keyword, 'focus_keyword should be recovered');
      assert.ok(cols.related_keywords, 'related_keywords should be recovered');
    } finally {
      // Ensure full restoration
      await seoFieldsMigration.up(qi(), Sequelize());
    }
  });

  test('24. Travel guide articles additive migrations: Existing columns are not deleted during rollback', async () => {
    // 1. Rollback SEO fields
    await seoFieldsMigration.down(qi(), Sequelize());

    // 2. Simulate that cover_image_alt was a pre-existing column created outside this migration
    await db.query('ALTER TABLE `travel_guide_articles` ADD COLUMN `cover_image_alt` VARCHAR(255) NULL');

    try {
      // 3. Run migration.up() — fails safely because cover_image_alt exists without ownership tracking
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /Migration preflight validation failed for table "travel_guide_articles": column "cover_image_alt" exists physically in the database but is not tracked in "_migration_column_ownership"/
      );

      // 4. Run migration.down() — must preserve untracked pre-existing cover_image_alt
      await seoFieldsMigration.down(qi(), Sequelize());

      const cols = await qi().describeTable('travel_guide_articles');
      assert.ok(cols.cover_image_alt, 'Pre-existing column cover_image_alt must NOT be deleted during rollback');
      assert.ok(!cols.meta_title, 'Migration-created column meta_title should not be present');
    } finally {
      // Clean up pre-existing test column and restore full migration
      try {
        await db.query('ALTER TABLE `travel_guide_articles` DROP COLUMN `cover_image_alt`');
      } catch {
        /* already dropped */
      }
      await seoFieldsMigration.up(qi(), Sequelize());
    }
  });

  test('25. Travel guide articles additive migrations: Rollback behavior is safe after a partially completed migration', async () => {
    // Test rollback on content_json
    await contentJsonMigration.down(qi(), Sequelize());

    const colsAfterDown = await qi().describeTable('travel_guide_articles');
    assert.ok(!colsAfterDown.content_json, 'content_json should be removed');

    // Repeated down() should be safely idempotent
    await contentJsonMigration.down(qi(), Sequelize());

    // Restore
    await contentJsonMigration.up(qi(), Sequelize());
    const colsAfterUp = await qi().describeTable('travel_guide_articles');
    assert.ok(colsAfterUp.content_json, 'content_json should be restored');
  });

  test('26. Travel guide articles additive migrations: Rollback fails safely if ownership tracking cannot be established', async () => {
    // Temporarily rename ownership table to simulate missing metadata across environments
    await db.query('RENAME TABLE `_migration_column_ownership` TO `_migration_column_ownership_backup`');

    try {
      await assert.rejects(
        async () => {
          await seoFieldsMigration.down(qi(), Sequelize());
        },
        /column ownership tracking table "_migration_column_ownership" does not exist/
      );

      // Verify no columns were dropped
      const cols = await qi().describeTable('travel_guide_articles');
      assert.ok(cols.meta_title, 'Columns must not be dropped when ownership tracking is missing');
    } finally {
      await db.query('RENAME TABLE `_migration_column_ownership_backup` TO `_migration_column_ownership`');
      await seoFieldsMigration.up(qi(), Sequelize());
    }
  });

  test('27. Additive migration safety: addColumn() succeeds but ownership insertion fails (genuine failure injection)', async () => {
    // 1. Rollback content_json to clean state
    await contentJsonMigration.down(qi(), Sequelize());

    const sequelize = qi().sequelize;
    const originalQuery = sequelize.query;
    let injectionTriggered = false;

    // Spy/interceptor on sequelize.query to simulate crash/failure during ownership INSERT
    sequelize.query = async function (...args) {
      const sql = args[0];
      const options = args[1];
      const sqlString = typeof sql === 'string' ? sql : (sql && sql.query ? sql.query : '');
      const replacements = options && options.replacements ? options.replacements : [];
      const isContentJson = sqlString.includes('content_json') || replacements.includes('content_json');
      if (
        sqlString.includes('INSERT INTO `_migration_column_ownership`') &&
        isContentJson
      ) {
        injectionTriggered = true;
        throw new Error('Injected failure: simulated crash during ownership INSERT after addColumn');
      }
      return Reflect.apply(originalQuery, this, args);
    };

    try {
      // 2. Execute migration.up() — addColumn() succeeds, but ownership INSERT fails
      await assert.rejects(
        async () => {
          await contentJsonMigration.up(qi(), Sequelize());
        },
        /Injected failure: simulated crash during ownership INSERT after addColumn/
      );

      assert.strictEqual(injectionTriggered, true, 'Failure injection must be triggered on ownership INSERT');

      // 3. Restore original query method immediately
      sequelize.query = originalQuery;

      // 4. Verify column physically exists on table
      const cols = await qi().describeTable('travel_guide_articles');
      assert.ok(cols.content_json, 'content_json must physically exist on table after addColumn() succeeded');

      // 5. Verify no ownership record exists
      const [rows] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `table_name` = 'travel_guide_articles' AND `column_name` = 'content_json'"
      );
      assert.strictEqual(Number(rows[0].cnt), 0, 'No ownership record must exist for untracked column');

      // 6. Verify subsequent up() rejects the untracked column
      await assert.rejects(
        async () => {
          await contentJsonMigration.up(qi(), Sequelize());
        },
        /Migration preflight validation failed for table "travel_guide_articles": column "content_json" exists physically in the database but is not tracked in "_migration_column_ownership"/
      );

      // 7. Verify down() preserves untracked column
      await contentJsonMigration.down(qi(), Sequelize());
      const colsAfterDown = await qi().describeTable('travel_guide_articles');
      assert.ok(colsAfterDown.content_json, 'Untracked column must NOT be deleted during rollback');
    } finally {
      sequelize.query = originalQuery;
      try {
        await qi().removeColumn('travel_guide_articles', 'content_json');
      } catch {
        /* already removed */
      }
      await db.query(
        "DELETE FROM `_migration_column_ownership` WHERE `table_name` = 'travel_guide_articles' AND `column_name` = 'content_json'"
      );
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('28. Additive migration safety: Re-running migration after ownership failure rejects untracked column', async () => {
    // 1. Rollback content_json
    await contentJsonMigration.down(qi(), Sequelize());

    // 2. Simulate partial failure state: column physically added, no ownership row recorded
    await qi().addColumn('travel_guide_articles', 'content_json', {
      type: Sequelize().JSON,
      allowNull: true,
    });

    try {
      // 3. Re-run migration.up() — must NOT silently proceed and must NOT claim ownership
      await assert.rejects(
        async () => {
          await contentJsonMigration.up(qi(), Sequelize());
        },
        /Migration preflight validation failed for table "travel_guide_articles": column "content_json" exists physically in the database but is not tracked in "_migration_column_ownership".*Manual schema inspection is required/
      );

      // Verify ownership record was NOT falsely created
      const [rows] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `table_name` = 'travel_guide_articles' AND `column_name` = 'content_json'"
      );
      assert.strictEqual(Number(rows[0].cnt), 0, 'Ownership must NOT be falsely claimed');
    } finally {
      try {
        await qi().removeColumn('travel_guide_articles', 'content_json');
      } catch {
        /* already removed */
      }
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('29. Additive migration safety: Rollback preserves untracked column and retains existing data', async () => {
    // 1. Rollback content_json
    await contentJsonMigration.down(qi(), Sequelize());

    // 2. Add untracked column and insert test payload
    await qi().addColumn('travel_guide_articles', 'content_json', {
      type: Sequelize().JSON,
      allowNull: true,
    });

    const testSlug = 'untracked-rollback-article-slug';
    await db.query(`
      INSERT INTO \`travel_guide_articles\` (
        \`title\`, \`slug\`, \`content\`, \`status\`, \`content_json\`, \`created_at\`, \`updated_at\`
      ) VALUES (
        'Untracked Rollback Test', '${testSlug}', 'Article Body', 'draft', '{"preserved":true}', NOW(), NOW()
      )
    `);

    try {
      // 3. Execute rollback — must preserve untracked column and its data
      await contentJsonMigration.down(qi(), Sequelize());

      const cols = await qi().describeTable('travel_guide_articles');
      assert.ok(cols.content_json, 'Untracked column content_json must NOT be deleted during rollback');

      const [rows] = await db.query(
        'SELECT `content_json` FROM `travel_guide_articles` WHERE `slug` = ?',
        { replacements: [testSlug] }
      );
      assert.strictEqual(rows.length, 1);
      const jsonVal = typeof rows[0].content_json === 'string'
        ? JSON.parse(rows[0].content_json)
        : rows[0].content_json;
      assert.deepStrictEqual(jsonVal, { preserved: true });
    } finally {
      await db.query('DELETE FROM `travel_guide_articles` WHERE `slug` = ?', {
        replacements: [testSlug],
      });
      try {
        await qi().removeColumn('travel_guide_articles', 'content_json');
      } catch {
        /* already removed */
      }
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('30. Additive migration safety: Malformed ownership table causes migration execution to fail safely', async () => {
    // Save existing ownership rows to restore later
    const [savedRows] = await db.query('SELECT * FROM `_migration_column_ownership`');

    try {
      // A) Incompatible storage engine (MEMORY)
      await db.query('DROP TABLE IF EXISTS `_migration_column_ownership`');
      await db.query(`
        CREATE TABLE \`_migration_column_ownership\` (
          \`migration_name\` VARCHAR(100) NOT NULL,
          \`table_name\` VARCHAR(50) NOT NULL,
          \`column_name\` VARCHAR(50) NOT NULL,
          \`created_at\` DATETIME NOT NULL,
          PRIMARY KEY (\`migration_name\`, \`table_name\`, \`column_name\`)
        ) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4;
      `);
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /storage engine is "MEMORY" \(expected InnoDB\)/
      );

      // Recreate standard InnoDB table for subsequent attribute checks
      await db.query('DROP TABLE IF EXISTS `_migration_column_ownership`');
      await db.query(`
        CREATE TABLE \`_migration_column_ownership\` (
          \`migration_name\` VARCHAR(255) NOT NULL,
          \`table_name\` VARCHAR(64) NOT NULL,
          \`column_name\` VARCHAR(64) NOT NULL,
          \`created_at\` DATETIME NOT NULL,
          PRIMARY KEY (\`migration_name\`, \`table_name\`, \`column_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // B) Incompatible column type (modify migration_name to INT)
      await db.query('ALTER TABLE `_migration_column_ownership` MODIFY COLUMN `migration_name` INT NOT NULL');
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /column "migration_name" has incompatible type/
      );
      await db.query('ALTER TABLE `_migration_column_ownership` MODIFY COLUMN `migration_name` VARCHAR(255) NOT NULL');

      // C) Nullable column (drop PK first, then modify column_name to NULL)
      await db.query('ALTER TABLE `_migration_column_ownership` DROP PRIMARY KEY');
      await db.query('ALTER TABLE `_migration_column_ownership` MODIFY COLUMN `column_name` VARCHAR(64) NULL');
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /column "column_name" allowNull mismatch \(expected NOT NULL, found nullable\)/
      );
      await db.query('ALTER TABLE `_migration_column_ownership` MODIFY COLUMN `column_name` VARCHAR(64) NOT NULL');
      await db.query('ALTER TABLE `_migration_column_ownership` ADD PRIMARY KEY (`migration_name`, `table_name`, `column_name`)');

      // D) Primary key mismatch (drop composite PK and add single column PK)
      await db.query('ALTER TABLE `_migration_column_ownership` DROP PRIMARY KEY, ADD PRIMARY KEY (`migration_name`)');
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /primary key mismatch \(expected composite PRIMARY KEY/
      );

      // Recreate standard table before testing extra column
      await db.query('DROP TABLE IF EXISTS `_migration_column_ownership`');
      await db.query(`
        CREATE TABLE \`_migration_column_ownership\` (
          \`migration_name\` VARCHAR(255) NOT NULL,
          \`table_name\` VARCHAR(64) NOT NULL,
          \`column_name\` VARCHAR(64) NOT NULL,
          \`created_at\` DATETIME NOT NULL,
          PRIMARY KEY (\`migration_name\`, \`table_name\`, \`column_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // E) Unexpected incompatible column in _migration_column_ownership
      await db.query('ALTER TABLE `_migration_column_ownership` ADD COLUMN `unmanaged_extra_col` INT NOT NULL');
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /unexpected column "unmanaged_extra_col" detected \(NOT NULL without default value\)/
      );
      await db.query('ALTER TABLE `_migration_column_ownership` DROP COLUMN `unmanaged_extra_col`');
    } finally {
      // Restore valid table schema
      await db.query('DROP TABLE IF EXISTS `_migration_column_ownership`');
      await db.query(`
        CREATE TABLE \`_migration_column_ownership\` (
          \`migration_name\` VARCHAR(255) NOT NULL,
          \`table_name\` VARCHAR(64) NOT NULL,
          \`column_name\` VARCHAR(64) NOT NULL,
          \`created_at\` DATETIME NOT NULL,
          PRIMARY KEY (\`migration_name\`, \`table_name\`, \`column_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      for (const row of savedRows) {
        await db.query(
          'INSERT IGNORE INTO `_migration_column_ownership` (`migration_name`, `table_name`, `column_name`, `created_at`) VALUES (?, ?, ?, ?)',
          { replacements: [row.migration_name, row.table_name, row.column_name, row.created_at] }
        );
      }
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('31. Additive migration safety: Preflight rejects untracked columns before modifying target table', async () => {
    // 1. Rollback both migrations
    await contentJsonMigration.down(qi(), Sequelize());
    await seoFieldsMigration.down(qi(), Sequelize());

    // 2. Pre-create one expected column from seoFieldsMigration (twitter_card, which is late in the list)
    // without recording ownership
    await qi().addColumn('travel_guide_articles', 'twitter_card', {
      type: Sequelize().STRING,
      allowNull: true,
    });

    try {
      // 3. Attempt to run seoFieldsMigration.up()
      // Preflight (Phase A) must detect untracked twitter_card and abort before adding cover_image_alt or any other columns (Phase B)
      await assert.rejects(
        async () => {
          await seoFieldsMigration.up(qi(), Sequelize());
        },
        /Migration preflight validation failed for table "travel_guide_articles": column "twitter_card" exists physically in the database but is not tracked in "_migration_column_ownership"/
      );

      // 4. Verify Phase B never ran: earlier expected columns (e.g. cover_image_alt, meta_title) were NOT added
      const cols = await qi().describeTable('travel_guide_articles');
      assert.strictEqual(cols.cover_image_alt, undefined, 'cover_image_alt was NOT added because preflight aborted early');
      assert.strictEqual(cols.meta_title, undefined, 'meta_title was NOT added because preflight aborted early');

      // 5. Verify no ownership records were created
      const [rows] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `migration_name` = '202610290001-add-seo-fields-to-travel-guide-articles'"
      );
      assert.strictEqual(Number(rows[0].cnt), 0, 'No ownership records should be inserted when preflight aborts');
    } finally {
      try {
        await qi().removeColumn('travel_guide_articles', 'twitter_card');
      } catch {
        /* already removed */
      }
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('32. Additive migration safety: Repeated migration execution and rollback remain safe without data loss', async () => {
    const testSlug = 'repeated-migration-lifecycle-test';

    // Insert article with SEO & JSON fields
    await db.query(`
      INSERT INTO \`travel_guide_articles\` (
        \`title\`, \`slug\`, \`content\`, \`status\`, \`cover_image_alt\`, \`meta_title\`,
        \`content_json\`, \`created_at\`, \`updated_at\`
      ) VALUES (
        'Lifecycle Test', '${testSlug}', 'Lifecycle Body', 'draft',
        'Lifecycle Alt', 'Lifecycle Meta', '{"cycle":1}', NOW(), NOW()
      )
    `);

    try {
      // Cycle 1: Multiple up() executions must be safely idempotent
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());

      // Verify row data preserved
      const [rows] = await db.query(
        'SELECT `cover_image_alt`, `meta_title`, `content_json` FROM `travel_guide_articles` WHERE `slug` = ?',
        { replacements: [testSlug] }
      );
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].cover_image_alt, 'Lifecycle Alt');
      assert.strictEqual(rows[0].meta_title, 'Lifecycle Meta');

      // Cycle 2: Rollback both migrations
      await contentJsonMigration.down(qi(), Sequelize());
      await seoFieldsMigration.down(qi(), Sequelize());

      // Verify columns removed
      const colsAfterDown = await qi().describeTable('travel_guide_articles');
      assert.ok(!colsAfterDown.content_json);
      assert.ok(!colsAfterDown.meta_title);

      // Repeated down() must be safely idempotent
      await contentJsonMigration.down(qi(), Sequelize());
      await seoFieldsMigration.down(qi(), Sequelize());

      // Cycle 3: Re-apply both migrations
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());

      // Verify columns restored
      const colsAfterRestore = await qi().describeTable('travel_guide_articles');
      assert.ok(colsAfterRestore.meta_title);
      assert.ok(colsAfterRestore.content_json);
    } finally {
      await db.query('DELETE FROM `travel_guide_articles` WHERE `slug` = ?', {
        replacements: [testSlug],
      });
      await seoFieldsMigration.up(qi(), Sequelize());
      await contentJsonMigration.up(qi(), Sequelize());
    }
  });

  test('33. Additive migration safety: Stale ownership record recovery when column dropped but ownership row remains', async () => {
    const migrationName = '202610300001-add-content-json-to-travel-guide-articles';

    // 1. Ensure the content_json migration is applied
    await contentJsonMigration.up(qi(), Sequelize());

    // 2. Verify its ownership record exists
    const [initialOwnership] = await db.query(
      'SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `migration_name` = ? AND `table_name` = ? AND `column_name` = ?',
      { replacements: [migrationName, 'travel_guide_articles', 'content_json'] }
    );
    assert.strictEqual(Number(initialOwnership[0].cnt), 1, 'Initial ownership record must exist');

    try {
      // 3. Simulate state left when a rollback drops physical column but fails to delete ownership record
      await qi().removeColumn('travel_guide_articles', 'content_json');

      // 4. Verify physical column is absent while ownership record remains
      const colsMissing = await qi().describeTable('travel_guide_articles');
      assert.strictEqual(colsMissing.content_json, undefined, 'Physical column must be absent');

      const [staleOwnership] = await db.query(
        'SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `migration_name` = ? AND `table_name` = ? AND `column_name` = ?',
        { replacements: [migrationName, 'travel_guide_articles', 'content_json'] }
      );
      assert.strictEqual(Number(staleOwnership[0].cnt), 1, 'Ownership record remains while column is absent (stale ownership state)');

      // 5. Execute the migration up() function again
      await contentJsonMigration.up(qi(), Sequelize());

      // 6. Verify column is recreated successfully
      const colsRecreated = await qi().describeTable('travel_guide_articles');
      assert.ok(colsRecreated.content_json, 'Physical column must be recreated successfully');

      // 7. Verify exactly one ownership record exists for migration/table/column combination
      const [ownershipAfterUp] = await db.query(
        'SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `migration_name` = ? AND `table_name` = ? AND `column_name` = ?',
        { replacements: [migrationName, 'travel_guide_articles', 'content_json'] }
      );
      assert.strictEqual(Number(ownershipAfterUp[0].cnt), 1, 'Exactly one ownership record must exist after up() without duplicate insertion');

      // 8. Execute down() and verify that recreated migration-owned column is removed
      await contentJsonMigration.down(qi(), Sequelize());
      const colsAfterDown = await qi().describeTable('travel_guide_articles');
      assert.strictEqual(colsAfterDown.content_json, undefined, 'Column must be removed after down()');

      // 9. Verify that ownership record is removed after successful rollback
      const [ownershipAfterDown] = await db.query(
        'SELECT COUNT(*) AS cnt FROM `_migration_column_ownership` WHERE `migration_name` = ? AND `table_name` = ? AND `column_name` = ?',
        { replacements: [migrationName, 'travel_guide_articles', 'content_json'] }
      );
      assert.strictEqual(Number(ownershipAfterDown[0].cnt), 0, 'Ownership record must be removed after successful rollback');
    } finally {
      // 10. Restore test database to expected initial state
      try {
        const colsInFinally = await qi().describeTable('travel_guide_articles');
        if (!colsInFinally.content_json) {
          await contentJsonMigration.up(qi(), Sequelize());
        }
      } catch {
        try {
          await qi().removeColumn('travel_guide_articles', 'content_json');
        } catch {
          /* already removed */
        }
        await db.query(
          'DELETE FROM `_migration_column_ownership` WHERE `migration_name` = ? AND `table_name` = ? AND `column_name` = ?',
          { replacements: [migrationName, 'travel_guide_articles', 'content_json'] }
        );
        await contentJsonMigration.up(qi(), Sequelize());
      }
    }
  });
});
