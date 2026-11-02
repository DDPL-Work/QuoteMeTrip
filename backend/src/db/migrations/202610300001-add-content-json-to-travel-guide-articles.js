/**
 * Additive Migration: Add content_json to travel_guide_articles.
 *
 * Implements production-safe idempotency, strict column validation,
 * partial recovery, and conservative rollback safety.
 */
import {
  addMigrationColumns,
  removeMigrationColumns,
} from '../migration-helpers.js';

const TABLE_NAME = 'travel_guide_articles';
const MIGRATION_NAME = '202610300001-add-content-json-to-travel-guide-articles';

export const CONTENT_JSON_COLUMNS = ['content_json'];

export async function up(queryInterface, Sequelize) {
  const columns = {
    content_json: {
      definition: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      typeMatch: /^JSON$/i,
      allowNull: true,
    },
  };

  await addMigrationColumns(queryInterface, TABLE_NAME, MIGRATION_NAME, columns);
}

export async function down(queryInterface) {
  await removeMigrationColumns(queryInterface, TABLE_NAME, MIGRATION_NAME, CONTENT_JSON_COLUMNS);
}
