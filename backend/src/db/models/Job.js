/**
 * Job model (Phase 6).
 *
 * Created automatically when a Traveller accepts a quotation. Starts
 * as `accepted`; transitions accepted → in_progress → completed, with
 * accepted/in_progress → cancelled. `quotation_id` is RESTRICT so the
 * accepted quotation cannot disappear under a live job.
 */
import { DataTypes, Model } from 'sequelize';

export const JOB_STATUSES = ['accepted', 'in_progress', 'completed', 'cancelled'];

/** Phase 6 transitions only. */
export const JOB_TRANSITIONS = {
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class Job extends Model {
  static initModel(sequelize) {
    if (Job.sequelize === sequelize) {
      return Job;
    }
    Job.init(
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
        quotationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'quotations', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        travellerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
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
          type: DataTypes.ENUM(...JOB_STATUSES),
          allowNull: false,
          defaultValue: 'accepted',
        },
        acceptedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        startedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cancelledAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'jobs',
        modelName: 'Job',
        indexes: [
          { fields: ['travel_request_id'] },
          { fields: ['quotation_id'] },
          { fields: ['traveller_id'] },
          { fields: ['agency_id'] },
          { fields: ['status'] },
        ],
      },
    );

    return Job;
  }
}
