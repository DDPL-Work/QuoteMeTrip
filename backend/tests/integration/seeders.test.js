/**
 * Seeder tests (Phase 2).
 *
 * Verifies seeders run against a fresh database, are idempotent
 * (no duplicates on re-run), and can be undone and re-applied.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp, runSeeds, undoSeeds } from '../../src/db/runner.js';

let db;
let MembershipPlan;

async function planCount() {
  return MembershipPlan.count();
}

before(async () => {
  resetSequelizeInstance();
  db = getSequelize();

  try {
    await db.authenticate();
  } catch (err) {
    throw new Error(
      `MySQL is unreachable for seeder tests: ${err.message}. ` +
        'Start it and run `npm run db:test:prepare --workspace=@troublefree/backend`.',
    );
  }

  ({ MembershipPlan } = initModels(db));
  await migrateUp(db);
  await MembershipPlan.destroy({ where: {}, force: true });
});

after(async () => {
  await closeDatabase();
  resetSequelizeInstance();
});

describe('Phase 2 seeders', () => {
  test('seeds the three foundation membership plans', async () => {
    const done = await runSeeds(db);
    assert.ok(done.length >= 1);
    assert.strictEqual(await planCount(), 3);

    const slugs = (await MembershipPlan.findAll({ order: [['slug', 'ASC']] })).map((p) => p.slug);
    assert.deepStrictEqual(slugs, ['basic', 'premium', 'standard']);
  });

  test('re-running seeds creates no duplicates', async () => {
    await runSeeds(db);
    await runSeeds(db);
    assert.strictEqual(await planCount(), 3);
  });

  test('undo removes seeded plans and re-seed restores them', async () => {
    await undoSeeds(db);
    await MembershipPlan.destroy({ where: {}, force: true });
    assert.strictEqual(await planCount(), 0);
    await runSeeds(db);
    assert.strictEqual(await planCount(), 3);
  });
});
