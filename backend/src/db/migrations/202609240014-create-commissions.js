/**
 * Migration: create `commissions` table for marketplace job fee tracking.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('commissions', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    agency_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'agency_profiles', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    job_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'jobs', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    quotation_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'quotations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    job_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    commission_rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.0,
    },
    commission_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.CHAR(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'paid'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    confirmed_by: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    confirmed_at: {
      type: Sequelize.DATE,
      allowNull: true,
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

  await queryInterface.addIndex('commissions', ['agency_id'], {
    name: 'commissions_agency_id_idx',
  });
  await queryInterface.addIndex('commissions', ['job_id'], {
    name: 'commissions_job_id_idx',
  });
  await queryInterface.addIndex('commissions', ['quotation_id'], {
    name: 'commissions_quotation_id_idx',
  });
  await queryInterface.addIndex('commissions', ['status'], {
    name: 'commissions_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('commissions');
}
