/**
 * QuotationItem model (Phase 5).
 *
 * Structured quotation lines. `totalPrice` is server-calculated
 * (quantity × unit_price) — never trusted from the client.
 */
import { DataTypes, Model } from 'sequelize';

export const QUOTATION_ITEM_TYPES = ['hotel', 'vehicle', 'driver', 'guide', 'service', 'other'];

export class QuotationItem extends Model {
  static initModel(sequelize) {
    if (QuotationItem.sequelize === sequelize) {
      return QuotationItem;
    }
    QuotationItem.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        quotationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'quotations', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        itemType: {
          type: DataTypes.ENUM(...QUOTATION_ITEM_TYPES),
          allowNull: false,
          defaultValue: 'other',
        },
        title: {
          type: DataTypes.STRING(190),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        quantity: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 1,
        },
        unitPrice: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        totalPrice: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'quotation_items',
        modelName: 'QuotationItem',
        indexes: [{ fields: ['quotation_id'] }, { fields: ['item_type'] }],
      },
    );

    return QuotationItem;
  }
}
