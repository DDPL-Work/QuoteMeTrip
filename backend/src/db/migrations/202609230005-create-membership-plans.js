/**
 * Migration: create `membership_plans` (reference catalogue).
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('membership_plans', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: Sequelize.STRING(120), allowNull: false },
    slug: { type: Sequelize.STRING(140), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    currency: { type: Sequelize.CHAR(3), allowNull: false, defaultValue: 'USD' },
    duration_days: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('membership_plans', ['name'], {
    unique: true,
    name: 'membership_plans_name_unique',
  });
  await queryInterface.addIndex('membership_plans', ['slug'], {
    unique: true,
    name: 'membership_plans_slug_unique',
  });
  await queryInterface.addIndex('membership_plans', ['status'], {
    name: 'membership_plans_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('membership_plans');
}
