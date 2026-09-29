/**
 * Migration: create `quotation_items` (structured quotation lines).
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('quotation_items', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    quotation_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'quotations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    item_type: {
      type: Sequelize.ENUM('hotel', 'vehicle', 'driver', 'guide', 'service', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    title: { type: Sequelize.STRING(190), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    quantity: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    metadata: { type: Sequelize.JSON, allowNull: true },
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

  await queryInterface.addIndex('quotation_items', ['quotation_id'], {
    name: 'quotation_items_quotation_id_idx',
  });
  await queryInterface.addIndex('quotation_items', ['item_type'], {
    name: 'quotation_items_item_type_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('quotation_items');
}
