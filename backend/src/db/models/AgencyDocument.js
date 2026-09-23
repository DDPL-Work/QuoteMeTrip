/**
 * AgencyDocument model (Phase 2 — persistence only).
 *
 * Stores agency onboarding/verification documents. The approval
 * workflow and file-upload APIs arrive in later phases — this model
 * only establishes the storage representation.
 */
import { DataTypes, Model } from 'sequelize';

export const AGENCY_DOCUMENT_TYPES = [
  'license',
  'tax_certificate',
  'identity',
  'address_proof',
  'other',
];
export const AGENCY_DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];

export class AgencyDocument extends Model {
  static initModel(sequelize) {
    if (AgencyDocument.sequelize === sequelize) {
      return AgencyDocument;
    }
    AgencyDocument.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        documentType: {
          type: DataTypes.ENUM(...AGENCY_DOCUMENT_TYPES),
          allowNull: false,
        },
        filePath: {
          type: DataTypes.STRING(512),
          allowNull: false,
        },
        originalName: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        mimeType: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        fileSize: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...AGENCY_DOCUMENT_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        verifiedBy: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        verificationNote: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'agency_documents',
        modelName: 'AgencyDocument',
        indexes: [{ fields: ['agency_id'] }, { fields: ['status'] }, { fields: ['document_type'] }],
      },
    );

    return AgencyDocument;
  }
}
