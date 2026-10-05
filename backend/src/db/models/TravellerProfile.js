/**
 * TravellerProfile model (Phase 2 — persistence only).
 *
 * One-to-one extension of `users` for traveller-domain data.
 * Identity/authentication fields stay in `users`; only
 * traveller-specific information lives here.
 */
import { DataTypes, Model } from 'sequelize';

export const TRAVELLER_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
export const SUPPORTED_LOCALES = ['en', 'tr'];

export class TravellerProfile extends Model {
  static initModel(sequelize) {
    if (TravellerProfile.sequelize === sequelize) {
      return TravellerProfile;
    }
    TravellerProfile.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        firstName: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        lastName: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        dateOfBirth: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        gender: {
          type: DataTypes.ENUM(...TRAVELLER_GENDERS),
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        preferredLocale: {
          type: DataTypes.ENUM(...SUPPORTED_LOCALES),
          allowNull: false,
          defaultValue: 'en',
        },
        profilePicture: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'profile_picture',
        },
        coverImage: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'cover_image',
        },
      },
      {
        sequelize,
        tableName: 'traveller_profiles',
        modelName: 'TravellerProfile',
        indexes: [{ unique: true, fields: ['user_id'] }],
      },
    );

    return TravellerProfile;
  }
}
