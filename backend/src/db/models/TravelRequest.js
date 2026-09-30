/**
 * TravelRequest model (Phase 4 — traveller business workflow).
 *
 * Draft-first lifecycle: a request starts as `draft` and moves to
 * `submitted` via POST /:id/submit. Quotation/acceptance/matching
 * states exist in the ENUM for later phases but have NO transitions
 * wired in Phase 4. Cancellation is allowed from `draft` and
 * `submitted` only.
 */
import { DataTypes, Model } from 'sequelize';

export const TRAVEL_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'matching',
  'quoted',
  'accepted',
  'cancelled',
  'completed',
];

export const ACCOMMODATION_TYPES = ['3_star', '4_star', '5_star', 's_class'];
export const PACKAGE_TYPES = [
  'blue_cruise',
  'full_package',
  'hotel_only',
  'vehicle_driver',
  'guide_activities',
];
export const CRUISE_DURATIONS = ['4d_3n', '6d_5n'];

/** Phase 4 transitions only. Later phases extend this map. */
export const TRAVEL_REQUEST_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  // Phase 6: acceptance closes the shopping phase for the request.
  submitted: ['cancelled', 'accepted'],
  matching: [],
  quoted: [],
  accepted: [],
  cancelled: [],
  completed: [],
};

export class TravelRequest extends Model {
  static initModel(sequelize) {
    if (TravelRequest.sequelize === sequelize) {
      return TravelRequest;
    }
    TravelRequest.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        travellerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        routeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'routes', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        status: {
          type: DataTypes.ENUM(...TRAVEL_REQUEST_STATUSES),
          allowNull: false,
          defaultValue: 'draft',
        },
        travelStartDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        travelEndDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        numberOfTravellers: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        luggageCount: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        accommodationType: {
          type: DataTypes.ENUM(...ACCOMMODATION_TYPES),
          allowNull: true,
        },
        hotelRequired: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        guideRequired: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        driverRequired: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        packageType: {
          type: DataTypes.ENUM(...PACKAGE_TYPES),
          allowNull: true,
        },
        cruiseDuration: {
          type: DataTypes.ENUM(...CRUISE_DURATIONS),
          allowNull: true,
        },
        specialRequests: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        submittedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'travel_requests',
        modelName: 'TravelRequest',
        indexes: [{ fields: ['traveller_id'] }, { fields: ['route_id'] }, { fields: ['status'] }],
      },
    );

    return TravelRequest;
  }
}
