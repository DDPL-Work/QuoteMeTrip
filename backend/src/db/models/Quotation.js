/**
 * Quotation model (Phase 5).
 *
 * Agency quotation for a matched travel request. Totals are ALWAYS
 * server-calculated from items (subtotal = Σ qty × unit_price;
 * total = subtotal — no taxes/discounts defined in Phase 5).
 * Lifecycle in Phase 5: draft → submitted, draft → withdrawn,
 * submitted → withdrawn. `accepted`/`rejected`/`expired` exist in the
 * ENUM for later phases only.
 */
import { DataTypes, Model } from 'sequelize';

export const QUOTATION_STATUSES = [
  'draft',
  'submitted',
  'withdrawn',
  'expired',
  'accepted',
  'rejected',
];

export const QUOTATION_TYPES = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];

/** Phase 5 transitions only. Later phases extend this map. */
export const QUOTATION_TRANSITIONS = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['withdrawn'],
  withdrawn: [],
  expired: [],
  accepted: [],
  rejected: [],
};

export class Quotation extends Model {
  static initModel(sequelize) {
    if (Quotation.sequelize === sequelize) {
      return Quotation;
    }
    Quotation.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        travelRequestId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'travel_requests', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        status: {
          type: DataTypes.ENUM(...QUOTATION_STATUSES),
          allowNull: false,
          defaultValue: 'draft',
        },
        quotationType: {
          type: DataTypes.ENUM(...QUOTATION_TYPES),
          allowNull: false,
        },
        currency: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        subtotal: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        totalAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        taxRate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        taxAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        taxLabel: {
          type: DataTypes.STRING(190),
          allowNull: true,
        },
        validUntil: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        greeting: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        packageOverview: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        itineraryDays: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        paymentDetails: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        inclusions: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        exclusions: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        termsSections: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        branding: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        submittedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        version: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        parentQuotationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'quotations', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
      },
      {
        sequelize,
        tableName: 'quotations',
        modelName: 'Quotation',
        indexes: [
          { fields: ['travel_request_id'] },
          { fields: ['agency_id'] },
          { fields: ['status'] },
          { fields: ['travel_request_id', 'created_at'] },
          { fields: ['travel_request_id', 'status', 'created_at'] },
          { fields: ['agency_id', 'travel_request_id', 'created_at'] },
        ],
      },
    );

    return Quotation;
  }
}
