/**
 * Migration: create `traveller_profiles` (1:1 extension of `users`).
 * The UNIQUE constraint on `user_id` enforces one profile per user.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('traveller_profiles', {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    first_name: { type: Sequelize.STRING(80), allowNull: true },
    last_name: { type: Sequelize.STRING(80), allowNull: true },
    phone: { type: Sequelize.STRING(30), allowNull: true },
    date_of_birth: { type: Sequelize.DATEONLY, allowNull: true },
    gender: {
      type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true,
    },
    country: { type: Sequelize.STRING(80), allowNull: true },
    city: { type: Sequelize.STRING(80), allowNull: true },
    preferred_locale: {
      type: Sequelize.ENUM('en', 'tr'),
      allowNull: false,
      defaultValue: 'en',
    },
    profile_picture: { type: Sequelize.TEXT, allowNull: true },
    cover_image: { type: Sequelize.TEXT, allowNull: true },
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

  await queryInterface.addIndex('traveller_profiles', ['user_id'], {
    unique: true,
    name: 'traveller_profiles_user_id_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('traveller_profiles');
}
