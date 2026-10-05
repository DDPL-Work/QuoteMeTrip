/**
 * Migration: add `profile_picture` and `cover_image` to `traveller_profiles`.
 */
export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('traveller_profiles');
  if (!table.profile_picture) {
    await queryInterface.addColumn('traveller_profiles', 'profile_picture', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
  if (!table.cover_image) {
    await queryInterface.addColumn('traveller_profiles', 'cover_image', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable('traveller_profiles');
  if (table.profile_picture) {
    await queryInterface.removeColumn('traveller_profiles', 'profile_picture');
  }
  if (table.cover_image) {
    await queryInterface.removeColumn('traveller_profiles', 'cover_image');
  }
}
