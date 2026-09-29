/**
 * Migration: create `messages` (conversation lines).
 * `sender_user_id` is nullable: system messages have no human sender.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('messages', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'conversations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sender_user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    message_type: {
      type: Sequelize.ENUM('text', 'system'),
      allowNull: false,
      defaultValue: 'text',
    },
    body: { type: Sequelize.TEXT, allowNull: false },
    metadata: { type: Sequelize.JSON, allowNull: true },
    read_at: { type: Sequelize.DATE, allowNull: true },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('messages', ['conversation_id'], {
    name: 'messages_conversation_id_idx',
  });
  await queryInterface.addIndex('messages', ['sender_user_id'], {
    name: 'messages_sender_user_id_idx',
  });
  await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
    name: 'messages_conversation_created_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('messages');
}
