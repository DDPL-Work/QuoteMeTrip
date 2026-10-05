import { DataTypes } from 'sequelize';

async function safeCreateTable(queryInterface, tableName, attributes) {
  try {
    await queryInterface.createTable(tableName, attributes);
  } catch (err) {
    if (
      !err.message?.includes('already exists') &&
      !err.original?.message?.includes('already exists') &&
      !err.message?.includes('Table')
    ) {
      throw err;
    }
  }
}

async function safeAddIndex(queryInterface, tableName, fields, options) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (err) {
    if (
      !err.message?.includes('Duplicate key name') &&
      !err.original?.message?.includes('Duplicate key name')
    ) {
      throw err;
    }
  }
}

export async function up(queryInterface) {
  await safeCreateTable(queryInterface, 'agency_coverages', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    agency_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'agency_profiles', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    destination_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'travel_guide_destinations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    region_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'travel_guide_regions', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    location_name: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await safeAddIndex(queryInterface, 'agency_coverages', ['location_name'], {
    name: 'agency_coverages_location_name_idx',
  });

  await safeAddIndex(queryInterface, 'agency_coverages', ['agency_id', 'location_name'], {
    unique: true,
    name: 'agency_coverages_agency_id_location_name_unique',
  });

  await safeCreateTable(queryInterface, 'agency_capabilities', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    agency_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'agency_profiles', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    service_type: {
      type: DataTypes.ENUM('hotel', 'guide', 'vehicle', 'driver', 'full_package', 'blue_cruise'),
      allowNull: false,
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await safeAddIndex(queryInterface, 'agency_capabilities', ['agency_id', 'service_type'], {
    unique: true,
    name: 'agency_capabilities_agency_id_service_type_unique',
  });
}

export async function down(queryInterface) {
  try {
    await queryInterface.dropTable('agency_capabilities');
  } catch {
    // ignore
  }
  try {
    await queryInterface.dropTable('agency_coverages');
  } catch {
    // ignore
  }
}
