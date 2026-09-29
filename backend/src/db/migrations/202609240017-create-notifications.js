export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notifications', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    event_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    channel: {
      type: Sequelize.ENUM('in_app', 'email', 'sms', 'web_push'),
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    data: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('pending', 'sent', 'failed', 'read'),
      allowNull: false,
      defaultValue: 'pending',
    },
    read_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    sent_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    failed_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    failure_reason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('notifications', ['event_type']);
  await queryInterface.addIndex('notifications', ['status']);
  await queryInterface.addIndex('notifications', ['created_at']);
  await queryInterface.addIndex('notifications', ['user_id', 'read_at']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('notifications');
}
