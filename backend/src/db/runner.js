/**
 * Lightweight migration/seeder runner (Phase 2).
 *
 * Applies versioned migration modules from `src/db/migrations/` and
 * tracks them in the `SequelizeMeta` table — the production schema
 * mechanism for this project. `sequelize.sync()` is intentionally NOT
 * used for schema management (no `alter`, never `force`).
 *
 * Migration modules export `up(queryInterface, Sequelize)` and
 * `down(queryInterface, Sequelize)` and are applied in filename order.
 * Seeders export `up(sequelize)` / `down(sequelize)` and are
 * idempotent by design (safe to re-run); they are not tracked.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DataTypes } from 'sequelize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDERS_DIR = path.join(__dirname, 'seeders');
const META_TABLE = 'SequelizeMeta';

async function listModules(dir) {
  const entries = await fs.readdir(dir);
  return entries.filter((name) => name.endsWith('.js')).sort();
}

async function loadModule(dir, name) {
  return import(pathToFileURL(path.join(dir, name)).href);
}

async function ensureMetaTable(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName || t.name)).flat();
  if (!names.includes(META_TABLE)) {
    await queryInterface.createTable(META_TABLE, {
      name: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    });
  }
}

async function getAppliedNames(sequelize) {
  await ensureMetaTable(sequelize);
  const [rows] = await sequelize.query(`SELECT \`name\` FROM \`${META_TABLE}\``);
  return new Set(rows.map((row) => row.name));
}

/**
 * Apply all pending migrations in order. Returns the applied names.
 */
export async function migrateUp(sequelize) {
  const applied = await getAppliedNames(sequelize);
  const queryInterface = sequelize.getQueryInterface();
  const { Sequelize } = await import('sequelize');
  const done = [];

  for (const name of await listModules(MIGRATIONS_DIR)) {
    if (applied.has(name)) {
      continue;
    }
    const migration = await loadModule(MIGRATIONS_DIR, name);
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(`INSERT INTO \`${META_TABLE}\` (\`name\`) VALUES (?)`, {
      replacements: [name],
    });
    done.push(name);
  }

  return done;
}

/**
 * Revert the last `steps` applied migrations (default 1).
 * Returns the reverted names (most recent first).
 */
export async function migrateDown(sequelize, steps = 1) {
  await ensureMetaTable(sequelize);
  const [rows] = await sequelize.query(
    `SELECT \`name\` FROM \`${META_TABLE}\` ORDER BY \`name\` DESC LIMIT ?`,
    { replacements: [steps] },
  );
  const queryInterface = sequelize.getQueryInterface();
  const { Sequelize } = await import('sequelize');
  const done = [];

  for (const { name } of rows) {
    const migration = await loadModule(MIGRATIONS_DIR, name);
    await migration.down(queryInterface, Sequelize);
    await sequelize.query(`DELETE FROM \`${META_TABLE}\` WHERE \`name\` = ?`, {
      replacements: [name],
    });
    done.push(name);
  }

  return done;
}

/**
 * Run all seeders in order. Seeders must be idempotent.
 */
export async function runSeeds(sequelize) {
  const done = [];
  for (const name of await listModules(SEEDERS_DIR)) {
    const seeder = await loadModule(SEEDERS_DIR, name);
    await seeder.up(sequelize);
    done.push(name);
  }
  return done;
}

/**
 * Undo all seeders in reverse order.
 */
export async function undoSeeds(sequelize) {
  const names = await listModules(SEEDERS_DIR);
  const done = [];
  for (const name of names.reverse()) {
    const seeder = await loadModule(SEEDERS_DIR, name);
    if (typeof seeder.down === 'function') {
      await seeder.down(sequelize);
    }
    done.push(name);
  }
  return done;
}
