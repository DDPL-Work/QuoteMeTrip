import { DataTypes, Model } from 'sequelize';

export class Rating extends Model {
  static initModel(sequelize) {
    if (Rating.sequelize === sequelize) {
      return Rating;
    }
    Rating.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        jobId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'jobs', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
          field: 'job_id',
        },
        travelRequestId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'travel_requests', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'travel_request_id',
        },
        travellerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'traveller_id',
        },
        agencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'agency_profiles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          field: 'agency_id',
        },
        rating: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'ratings',
        modelName: 'Rating',
        underscored: true,
        indexes: [
          { fields: ['job_id'], unique: true },
          { fields: ['agency_id'] },
          { fields: ['traveller_id'] },
          { fields: ['travel_request_id'] },
        ],
      },
    );

    return Rating;
  }
}
