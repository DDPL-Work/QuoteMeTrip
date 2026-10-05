/**
 * Add disappearing_ttl to conversations and expires_at to messages.
 */
export async function up(queryInterface, Sequelize) {
  const conversationsTable = await queryInterface.describeTable('conversations');
  if (!conversationsTable.disappearing_ttl) {
    await queryInterface.addColumn('conversations', 'disappearing_ttl', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  }

  const messagesTable = await queryInterface.describeTable('messages');
  if (!messagesTable.expires_at) {
    await queryInterface.addColumn('messages', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const conversationsTable = await queryInterface.describeTable('conversations');
  if (conversationsTable.disappearing_ttl) {
    await queryInterface.removeColumn('conversations', 'disappearing_ttl');
  }

  const messagesTable = await queryInterface.describeTable('messages');
  if (messagesTable.expires_at) {
    await queryInterface.removeColumn('messages', 'expires_at');
  }
}
