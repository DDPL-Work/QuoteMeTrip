/**
 * Migration: create `agency_profiles` (1:1 extension of `users`).
 * The UNIQUE constraint on `user_id` enforces one profile per user.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('agency_profiles', {
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
    agency_name: { type: Sequelize.STRING(160), allowNull: false },
    contact_person: { type: Sequelize.STRING(120), allowNull: true },
    phone: { type: Sequelize.STRING(30), allowNull: true },
    business_email: { type: Sequelize.STRING(190), allowNull: true },
    address: { type: Sequelize.TEXT, allowNull: true },
    city: { type: Sequelize.STRING(80), allowNull: true },
    country: { type: Sequelize.STRING(80), allowNull: true },
    website: { type: Sequelize.STRING(255), allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    logo_path: { type: Sequelize.STRING(255), allowNull: true },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'pending',
    },
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

  await queryInterface.addIndex('agency_profiles', ['user_id'], {
    unique: true,
    name: 'agency_profiles_user_id_unique',
  });
  await queryInterface.addIndex('agency_profiles', ['status'], {
    name: 'agency_profiles_status_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('agency_profiles');
}
