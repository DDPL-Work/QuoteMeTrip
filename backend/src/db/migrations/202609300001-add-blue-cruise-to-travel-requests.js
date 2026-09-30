/**
 * Migration: add Blue Cruise service type & cruise_duration to `travel_requests` and `quotations`.
 * Preserves all existing records and historical package_types.
 */
export async function up(queryInterface, Sequelize) {
  // 1. Add `cruise_duration` column to `travel_requests`
  await queryInterface.addColumn('travel_requests', 'cruise_duration', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });

  // 2. Safely widen `package_type` on `travel_requests` if needed
  try {
    await queryInterface.changeColumn('travel_requests', 'package_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  } catch {
    // Column already compatible or dialect handled
  }

  // 3. Safely widen `type` on `quotations` if needed
  try {
    await queryInterface.changeColumn('quotations', 'type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  } catch {
    // Column already compatible or dialect handled
  }
}

export async function down(queryInterface) {
  try {
    await queryInterface.removeColumn('travel_requests', 'cruise_duration');
  } catch {
    // Ignore if column missing
  }
}
