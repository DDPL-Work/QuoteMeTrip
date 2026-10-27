import { DataTypes, Model } from 'sequelize';

export class PasswordReset extends Model {
  static initModel(sequelize) {
    if (PasswordReset.sequelize === sequelize) {
      return PasswordReset;
    }

    PasswordReset.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        purpose: {
          type: DataTypes.ENUM('password_reset'),
          allowNull: false,
          defaultValue: 'password_reset',
        },
        otpHash: {
          type: DataTypes.CHAR(64),
          allowNull: false,
        },
        resetTokenHash: {
          type: DataTypes.CHAR(64),
          allowNull: true,
        },
        attempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        maxAttempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 5,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        consumedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'password_resets',
        modelName: 'PasswordReset',
        indexes: [
          { fields: ['userId'] },
          { fields: ['expiresAt'] },
          { fields: ['resetTokenHash'] },
        ],
      },
    );

    return PasswordReset;
  }
}
