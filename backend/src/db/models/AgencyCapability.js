import { DataTypes, Model } from 'sequelize';

export const AGENCY_SERVICE_TYPES = [
  'hotel',
  'guide',
  'vehicle',
  'driver',
  'full_package',
  'blue_cruise',
];

export class AgencyCapability extends Model {
  static initModel(sequelize) {
    if (AgencyCapability.sequelize === sequelize) {
      return AgencyCapability;
    }
    AgencyCapability.init(
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
          field: 'agency_id',
        },
        serviceType: {
          type: DataTypes.ENUM(...AGENCY_SERVICE_TYPES),
          allowNull: false,
          field: 'service_type',
        },
        isEnabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_enabled',
        },
      },
      {
        sequelize,
        tableName: 'agency_capabilities',
        modelName: 'AgencyCapability',
        underscored: true,
        indexes: [
          { fields: ['agency_id'] },
          { unique: true, fields: ['agency_id', 'service_type'] },
        ],
      },
    );

    return AgencyCapability;
  }
}
