import { DataTypes, Model } from 'sequelize';

export class PushToken extends Model {
  static initModel(sequelize) {
    if (PushToken.sequelize === sequelize) {
      return PushToken;
    }
    PushToken.init(
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
          field: 'user_id',
        },
        token: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        platform: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_used_at',
        },
      },
      {
        sequelize,
        tableName: 'push_tokens',
        modelName: 'PushToken',
        underscored: true,
        indexes: [{ fields: ['user_id'] }],
      },
    );

    return PushToken;
  }
}
