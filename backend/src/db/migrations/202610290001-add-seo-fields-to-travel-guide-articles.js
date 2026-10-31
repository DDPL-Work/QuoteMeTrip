/**
 * Additive Migration: Add SEO fields to travel_guide_articles.
 *
 * Implements production-safe idempotency, strict column validation,
 * partial recovery, and conservative rollback safety.
 */
import {
  addMigrationColumns,
  removeMigrationColumns,
} from '../migration-helpers.js';

const TABLE_NAME = 'travel_guide_articles';
const MIGRATION_NAME = '202610290001-add-seo-fields-to-travel-guide-articles';

export const SEO_COLUMNS = [
  'cover_image_alt',
  'meta_title',
  'meta_description',
  'canonical_url',
  'meta_robots',
  'og_title',
  'og_description',
  'og_image',
  'twitter_card',
  'focus_keyword',
  'related_keywords',
];

export async function up(queryInterface, Sequelize) {
  const columns = {
    cover_image_alt: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    meta_title: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    meta_description: {
      definition: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      typeMatch: /^(?:TINY|MEDIUM|LONG)?TEXT$/i,
      allowNull: true,
    },
    canonical_url: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    meta_robots: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'index, follow',
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
      defaultValue: 'index, follow',
    },
    og_title: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    og_description: {
      definition: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      typeMatch: /^(?:TINY|MEDIUM|LONG)?TEXT$/i,
      allowNull: true,
    },
    og_image: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    twitter_card: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'summary_large_image',
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
      defaultValue: 'summary_large_image',
    },
    focus_keyword: {
      definition: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      typeMatch: /^VARCHAR(?:\(\d+\))?$/i,
      allowNull: true,
    },
    related_keywords: {
      definition: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      typeMatch: /^(?:TINY|MEDIUM|LONG)?TEXT$/i,
      allowNull: true,
    },
  };

  await addMigrationColumns(queryInterface, TABLE_NAME, MIGRATION_NAME, columns);
}

export async function down(queryInterface) {
  await removeMigrationColumns(queryInterface, TABLE_NAME, MIGRATION_NAME, SEO_COLUMNS);
}
