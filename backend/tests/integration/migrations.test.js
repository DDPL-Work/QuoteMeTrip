/**
 * Migration tests (Phase 2).
 *
 * Verifies against a FRESH test database:
 *   drop everything -> migrate up -> schema exists
 *   -> migrate down -> schema reverts
 *   -> migrate up again -> schema restored
 *
 * Leaves the test database fully migrated for the other suites.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { migrateUp, migrateDown } from '../../src/db/runner.js';

const EXPECTED_TABLES = [
  'users',
  'traveller_profiles',
  'agency_profiles',
  'agency_documents',
  'membership_plans',
  'agency_memberships',
];

let db;

async function dropEverything() {
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    const qi = db.getQueryInterface();
    for (const table of [...EXPECTED_TABLES, 'SequelizeMeta']) {
      try {
        await qi.dropTable(table);
      } catch {
        // Table did not exist — nothing to drop.
      }
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

describe('Phase 2 migrations', () => {
  test('migrate up creates all foundation tables', async () => {
    const applied = await migrateUp(db);
    assert.strictEqual(applied.length, 6);

    const tables = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tables.includes(table), `table ${table} should exist`);
    }

    const [meta] = await db.query('SELECT COUNT(*) AS count FROM `SequelizeMeta`');
    assert.strictEqual(Number(meta[0].count), 6);

    const [indexes] = await db.query('SHOW INDEX FROM `users`');
    const names = indexes.map((idx) => idx.Key_name);
    assert.ok(names.includes('users_email_unique'), 'unique email index should exist');
  });

  test('migrate up is idempotent (no pending work on re-run)', async () => {
    const applied = await migrateUp(db);
    assert.strictEqual(applied.length, 0);
  });

  test('migrate down reverts, migrate up restores', async () => {
    const reverted = await migrateDown(db, 6);
    assert.strictEqual(reverted.length, 6);

    const tablesAfterDown = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(!tablesAfterDown.includes(table), `table ${table} should be gone`);
    }

    const restored = await migrateUp(db);
    assert.strictEqual(restored.length, 6);

    const tablesAfterUp = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tablesAfterUp.includes(table), `table ${table} should be back`);
    }
  });
});
