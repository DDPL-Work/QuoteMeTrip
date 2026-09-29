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
  // Phase 6 — messaging, acceptance & jobs.
  'conversations',
  'messages',
  'jobs',
  // Phase 7 — admin operations, commissions & audit logging.
  'commissions',
  'audit_logs',
  // Phase 8 — notifications, weather, travel guide & ratings.
  'notifications',
  'push_tokens',
  'weather_cache',
  'travel_guide_regions',
  'travel_guide_destinations',
  'travel_guide_articles',
  'ratings',
];

const EXPECTED_MIGRATION_COUNT = 29;

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

describe('Phase 2 + Phase 3 + Phase 4 + Phase 5 migrations', () => {
  test('migrate up creates all foundation tables', async () => {
    const applied = await migrateUp(db);
    assert.strictEqual(applied.length, EXPECTED_MIGRATION_COUNT);

    const tables = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tables.includes(table), `table ${table} should exist`);
    }

    const [meta] = await db.query('SELECT COUNT(*) AS count FROM `SequelizeMeta`');
    assert.strictEqual(Number(meta[0].count), EXPECTED_MIGRATION_COUNT);

    const [indexes] = await db.query('SHOW INDEX FROM `users`');
    const names = indexes.map((idx) => idx.Key_name);
    assert.ok(names.includes('users_email_unique'), 'unique email index should exist');

    // Phase 3: refresh-session storage holds hashes only, with the
    // indexes needed for session lookup, family revocation, and
    // expiry cleanup.
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

    // Phase 3: normalized provider identities with a composite unique
    // constraint (one local user per provider identity).
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
    const reverted = await migrateDown(db, EXPECTED_MIGRATION_COUNT);
    assert.strictEqual(reverted.length, EXPECTED_MIGRATION_COUNT);

    const tablesAfterDown = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(!tablesAfterDown.includes(table), `table ${table} should be gone`);
    }

    const restored = await migrateUp(db);
    assert.strictEqual(restored.length, EXPECTED_MIGRATION_COUNT);

    const tablesAfterUp = await listTables();
    for (const table of EXPECTED_TABLES) {
      assert.ok(tablesAfterUp.includes(table), `table ${table} should be back`);
    }
  });
});
