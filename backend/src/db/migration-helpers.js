/**
 * Reusable Production-Safe Schema Migration & Recovery Helpers.
 *
 * Implements strict, non-destructive schema validation, partial recovery,
 * index verification, and foreign-key consistency checks.
 */

/**
 * Determine whether a physical table exists in the current database.
 */
export async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  const names = tables
    .map((t) => (typeof t === 'string' ? t : t.tableName || t.name))
    .flat()
    .filter(Boolean);
  return names.includes(tableName);
}

/**
 * Validate that an existing table satisfies all critical column specifications,
 * including data types, nullability, primary key, auto-increment, and default values.
 * Uses information_schema.COLUMNS joined with describeTable() for precise metadata.
 */
export async function validateExistingColumns(queryInterface, tableName, expectedColumns) {
  const existingColumns = await queryInterface.describeTable(tableName);

  const [infoCols] = await queryInterface.sequelize.query(
    `SELECT
       COLUMN_NAME AS columnName,
       COLUMN_DEFAULT AS columnDefault,
       EXTRA AS extra,
       DATA_TYPE AS dataType,
       COLUMN_TYPE AS columnType,
       IS_NULLABLE AS isNullable
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    { replacements: [tableName] }
  );

  const infoMap = new Map(infoCols.map((col) => [col.columnName, col]));

  for (const [colName, expected] of Object.entries(expectedColumns)) {
    const actual = existingColumns[colName];
    const info = infoMap.get(colName);

    if (!actual || !info) {
      throw new Error(
        `Migration validation failed for table "${tableName}": required column "${colName}" is missing. Manual schema inspection is required.`
      );
    }

    if (expected.primaryKey !== undefined) {
      const isPk = Boolean(actual.primaryKey);
      if (isPk !== Boolean(expected.primaryKey)) {
        throw new Error(
          `Migration validation failed for table "${tableName}": column "${colName}" primaryKey mismatch (expected ${expected.primaryKey}, found ${isPk}). Manual schema inspection is required.`
        );
      }
    }

    if (expected.allowNull !== undefined) {
      if (actual.allowNull !== expected.allowNull) {
        throw new Error(
          `Migration validation failed for table "${tableName}": column "${colName}" allowNull mismatch (expected ${expected.allowNull}, found ${actual.allowNull}). Manual schema inspection is required.`
        );
      }
    }

    if (expected.autoIncrement !== undefined) {
      const isAuto = Boolean(actual.autoIncrement || /auto_increment/i.test(info.extra));
      if (isAuto !== Boolean(expected.autoIncrement)) {
        throw new Error(
          `Migration validation failed for table "${tableName}": column "${colName}" autoIncrement mismatch (expected ${expected.autoIncrement}, found ${isAuto}). Manual schema inspection is required.`
        );
      }
    }

    if (expected.typeMatch) {
      const actualType = String(actual.type || info.columnType || '').trim();
      const matches = expected.typeMatch instanceof RegExp
        ? expected.typeMatch.test(actualType)
        : actualType.toUpperCase() === String(expected.typeMatch).toUpperCase();

      if (!matches) {
        throw new Error(
          `Migration validation failed for table "${tableName}": column "${colName}" has incompatible type "${actualType}" (expected pattern ${expected.typeMatch}). Manual schema inspection is required.`
        );
      }
    }

    // Default value validation
    if (expected.defaultValue !== undefined) {
      const actualRawDefault = info.columnDefault;

      if (expected.defaultValue === null) {
        if (actualRawDefault !== null) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected null, found "${actualRawDefault}"). Manual schema inspection is required.`
          );
        }
      } else if (expected.defaultValue === 'CURRENT_TIMESTAMP') {
        const isCurrentTimestamp =
          actualRawDefault && /^CURRENT_TIMESTAMP(?:\(\))?$/i.test(actualRawDefault);

        if (!isCurrentTimestamp) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected CURRENT_TIMESTAMP, found "${actualRawDefault}"). Manual schema inspection is required.`
          );
        }

        const hasOnUpdate = Boolean(info.extra && /on update CURRENT_TIMESTAMP(?:\(\))?/i.test(info.extra));
        const expectedOnUpdate = Boolean(expected.onUpdate === 'CURRENT_TIMESTAMP');

        if (expectedOnUpdate && !hasOnUpdate) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" onUpdate mismatch (expected CURRENT_TIMESTAMP, found "${info.extra || 'none'}"). Manual schema inspection is required.`
          );
        }
        if (!expectedOnUpdate && hasOnUpdate) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" has unexpected on update behavior ("${info.extra}"). Manual schema inspection is required.`
          );
        }
      } else if (typeof expected.defaultValue === 'number') {
        const actualNum = actualRawDefault !== null ? Number(actualRawDefault) : NaN;
        if (Number.isNaN(actualNum) || actualNum !== expected.defaultValue) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected ${expected.defaultValue}, found "${actualRawDefault}"). Manual schema inspection is required.`
          );
        }
      } else {
        // String / ENUM default: normalize outer quotes
        const normalizedActual = String(actualRawDefault || '').replace(/^['"]|['"]$/g, '').trim();
        const normalizedExpected = String(expected.defaultValue).replace(/^['"]|['"]$/g, '').trim();

        if (normalizedActual !== normalizedExpected) {
          throw new Error(
            `Migration validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected "${expected.defaultValue}", found "${actualRawDefault}"). Manual schema inspection is required.`
          );
        }
      }
    }
  }
}

/**
 * Query foreign key definitions from MySQL information_schema, joining
 * REFERENTIAL_CONSTRAINTS to KEY_COLUMN_USAGE on constraint schema, name,
 * and table name, verifying referenced table, column, and referential actions.
 */
export async function validateExistingForeignKeys(sequelize, tableName, expectedForeignKeys = []) {
  if (!expectedForeignKeys || expectedForeignKeys.length === 0) {
    return;
  }

  const [actualFks] = await sequelize.query(
    `SELECT
       kcu.CONSTRAINT_NAME AS constraintName,
       kcu.TABLE_NAME AS tableName,
       kcu.COLUMN_NAME AS columnName,
       kcu.REFERENCED_TABLE_NAME AS referencedTableName,
       kcu.REFERENCED_COLUMN_NAME AS referencedColumnName,
       rc.DELETE_RULE AS onDelete,
       rc.UPDATE_RULE AS onUpdate
     FROM information_schema.KEY_COLUMN_USAGE kcu
     JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
       AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
       AND kcu.TABLE_NAME = rc.TABLE_NAME
     WHERE kcu.TABLE_SCHEMA = DATABASE()
       AND kcu.TABLE_NAME = ?
       AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: [tableName] }
  );

  for (const expected of expectedForeignKeys) {
    const candidates = actualFks.filter(
      (fk) =>
        fk.tableName === tableName &&
        fk.columnName === expected.columnName &&
        fk.referencedTableName === expected.referencedTableName &&
        fk.referencedColumnName === expected.referencedColumnName
    );

    if (candidates.length === 0) {
      throw new Error(
        `Migration validation failed for table "${tableName}": missing foreign key constraint on "${expected.columnName}" referencing "${expected.referencedTableName}(${expected.referencedColumnName})". Manual schema inspection is required.`
      );
    }

    // Check if any candidate satisfies all required referential rules
    const exactMatch = candidates.find((fk) => {
      const matchDelete =
        !expected.onDelete || fk.onDelete.toUpperCase() === expected.onDelete.toUpperCase();
      const matchUpdate =
        !expected.onUpdate || fk.onUpdate.toUpperCase() === expected.onUpdate.toUpperCase();
      return matchDelete && matchUpdate;
    });

    if (exactMatch) {
      continue;
    }

    // No candidate satisfied both rules; report specific rule violation
    const first = candidates[0];
    if (expected.onDelete && first.onDelete.toUpperCase() !== expected.onDelete.toUpperCase()) {
      throw new Error(
        `Migration validation failed for table "${tableName}": foreign key on "${expected.columnName}" has ON DELETE ${first.onDelete} (expected ${expected.onDelete}). Manual schema inspection is required.`
      );
    }

    if (expected.onUpdate && first.onUpdate.toUpperCase() !== expected.onUpdate.toUpperCase()) {
      throw new Error(
        `Migration validation failed for table "${tableName}": foreign key on "${expected.columnName}" has ON UPDATE ${first.onUpdate} (expected ${expected.onUpdate}). Manual schema inspection is required.`
      );
    }

    throw new Error(
      `Migration validation failed for table "${tableName}": foreign key on "${expected.columnName}" does not satisfy expected constraint definition. Manual schema inspection is required.`
    );
  }
}

/**
 * Verify that an index exists and has matching columns, order, and uniqueness.
 * Also checks prefix length and index type where metadata is available.
 * If missing, safely creates it (performing bounded duplicate checks if unique).
 * If incompatible, fails with an explicit error.
 */
export async function ensureIndex(queryInterface, tableName, expectedIndex, checkDuplicateFn = null) {
  const existingIndexes = await queryInterface.showIndex(tableName);
  const found = existingIndexes.find((idx) => idx.name === expectedIndex.name);

  if (found) {
    const actualFields = (found.fields || []).map((f) => f.attribute || f.name);
    const expectedFieldNames = expectedIndex.fields.map((f) =>
      typeof f === 'string' ? f : f.name || f.attribute
    );

    const fieldsMatch =
      actualFields.length === expectedFieldNames.length &&
      actualFields.every((f, i) => f === expectedFieldNames[i]);

    if (!fieldsMatch) {
      throw new Error(
        `Migration validation failed for table "${tableName}": index "${expectedIndex.name}" indexes columns [${actualFields.join(
          ', '
        )}] (expected [${expectedFieldNames.join(', ')}]). Manual schema inspection is required.`
      );
    }

    const isUnique = Boolean(found.unique);
    const expectedUnique = Boolean(expectedIndex.unique);
    if (isUnique !== expectedUnique) {
      throw new Error(
        `Migration validation failed for table "${tableName}": index "${expectedIndex.name}" uniqueness mismatch (expected ${expectedUnique ? 'unique' : 'non-unique'}, found ${isUnique ? 'unique' : 'non-unique'}). Manual schema inspection is required.`
      );
    }

    // Validate index type where explicitly defined (e.g. BTREE, FULLTEXT)
    if (expectedIndex.type && found.type) {
      if (found.type.toUpperCase() !== expectedIndex.type.toUpperCase()) {
        throw new Error(
          `Migration validation failed for table "${tableName}": index "${expectedIndex.name}" type mismatch (expected ${expectedIndex.type}, found ${found.type}). Manual schema inspection is required.`
        );
      }
    }

    // Validate prefix lengths if explicitly specified in fields metadata
    for (let i = 0; i < expectedIndex.fields.length; i++) {
      const expField = expectedIndex.fields[i];
      const actField = (found.fields || [])[i];
      if (typeof expField === 'object' && expField !== null && expField.length !== undefined) {
        if (actField && actField.length !== expField.length) {
          throw new Error(
            `Migration validation failed for table "${tableName}": index "${expectedIndex.name}" column "${actField.attribute || actField.name}" prefix length mismatch (expected ${expField.length}, found ${actField.length || 'none'}). Manual schema inspection is required.`
          );
        }
      }
    }

    return; // Index exists and is fully compatible
  }

  // Index is missing. If it is unique, run duplicate check if provided
  if (expectedIndex.unique && typeof checkDuplicateFn === 'function') {
    await checkDuplicateFn(queryInterface.sequelize);
  }

  // Normalize fields definition for queryInterface.addIndex
  const addIndexFields = expectedIndex.fields.map((f) => {
    if (typeof f === 'object' && f !== null) {
      return {
        name: f.name || f.attribute,
        ...(f.length !== undefined ? { length: f.length } : {}),
        ...(f.order ? { order: f.order } : {}),
      };
    }
    return f;
  });

  const indexOptions = {
    name: expectedIndex.name,
    unique: Boolean(expectedIndex.unique),
    ...(expectedIndex.type ? { type: expectedIndex.type } : {}),
  };

  // Create the missing index cleanly
  await queryInterface.addIndex(tableName, addIndexFields, indexOptions);
}

/**
 * Ensure persistent tracking table exists and satisfies required schema:
 * - migration_name: VARCHAR(255) NOT NULL
 * - table_name: VARCHAR(64) NOT NULL
 * - column_name: VARCHAR(64) NOT NULL
 * - created_at: DATETIME NOT NULL
 * - Composite primary key: (migration_name, table_name, column_name)
 * - Storage engine: InnoDB
 *
 * If the tracking table exists but is incompatible, fails immediately before modifying the target table.
 * Never automatically drops, alters, or overwrites an incompatible tracking table.
 */
export async function ensureColumnOwnershipTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`_migration_column_ownership\` (
      \`migration_name\` VARCHAR(255) NOT NULL,
      \`table_name\` VARCHAR(64) NOT NULL,
      \`column_name\` VARCHAR(64) NOT NULL,
      \`created_at\` DATETIME NOT NULL,
      PRIMARY KEY (\`migration_name\`, \`table_name\`, \`column_name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 1. Validate storage engine is InnoDB
  const [tableMeta] = await sequelize.query(`
    SELECT ENGINE AS engine
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '_migration_column_ownership'
  `);

  if (!tableMeta || tableMeta.length === 0) {
    throw new Error(
      'Migration validation failed for table "_migration_column_ownership": table does not exist. Manual schema inspection is required.'
    );
  }

  const engine = String(tableMeta[0].engine || '').toUpperCase();
  if (engine !== 'INNODB') {
    throw new Error(
      `Migration validation failed for table "_migration_column_ownership": storage engine is "${tableMeta[0].engine}" (expected InnoDB). Manual schema inspection is required.`
    );
  }

  // 2. Validate columns and nullability
  const [colMeta] = await sequelize.query(`
    SELECT
      COLUMN_NAME AS columnName,
      DATA_TYPE AS dataType,
      COLUMN_TYPE AS columnType,
      IS_NULLABLE AS isNullable,
      COLUMN_DEFAULT AS columnDefault
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '_migration_column_ownership'
  `);

  const colMap = new Map(colMeta.map((c) => [c.columnName, c]));

  const requiredColumns = {
    migration_name: { typeRegex: /^varchar\(255\)$/i, expectedType: 'VARCHAR(255)' },
    table_name: { typeRegex: /^varchar\(64\)$/i, expectedType: 'VARCHAR(64)' },
    column_name: { typeRegex: /^varchar\(64\)$/i, expectedType: 'VARCHAR(64)' },
    created_at: { typeRegex: /^datetime/i, expectedType: 'DATETIME' },
  };

  for (const [colName, req] of Object.entries(requiredColumns)) {
    const col = colMap.get(colName);
    if (!col) {
      throw new Error(
        `Migration validation failed for table "_migration_column_ownership": required column "${colName}" is missing. Manual schema inspection is required.`
      );
    }

    if (col.isNullable !== 'NO') {
      throw new Error(
        `Migration validation failed for table "_migration_column_ownership": column "${colName}" allowNull mismatch (expected NOT NULL, found nullable). Manual schema inspection is required.`
      );
    }

    const actualType = String(col.columnType || '').trim();
    if (!req.typeRegex.test(actualType)) {
      throw new Error(
        `Migration validation failed for table "_migration_column_ownership": column "${colName}" has incompatible type "${actualType}" (expected ${req.expectedType}). Manual schema inspection is required.`
      );
    }
  }

  // 3. Reject unexpected columns, particularly NOT NULL columns without defaults
  for (const col of colMeta) {
    if (!requiredColumns[col.columnName]) {
      const isDangerous = col.isNullable === 'NO' && col.columnDefault === null;
      throw new Error(
        `Migration validation failed for table "_migration_column_ownership": unexpected column "${col.columnName}" detected${
          isDangerous ? ' (NOT NULL without default value)' : ''
        }. Manual schema inspection is required.`
      );
    }
  }

  // 4. Validate composite primary key (migration_name, table_name, column_name)
  const [pkMeta] = await sequelize.query(`
    SELECT
      COLUMN_NAME AS columnName,
      ORDINAL_POSITION AS ordinalPosition
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '_migration_column_ownership'
      AND CONSTRAINT_NAME = 'PRIMARY'
    ORDER BY ORDINAL_POSITION ASC
  `);

  const expectedPk = ['migration_name', 'table_name', 'column_name'];
  const actualPk = pkMeta.map((k) => k.columnName);

  const pkValid =
    actualPk.length === expectedPk.length &&
    actualPk.every((name, idx) => name === expectedPk[idx]);

  if (!pkValid) {
    throw new Error(
      `Migration validation failed for table "_migration_column_ownership": primary key mismatch (expected composite PRIMARY KEY (${expectedPk.join(
        ', '
      )}), found [${actualPk.join(', ')}]). Manual schema inspection is required.`
    );
  }
}

/**
 * Add expected columns to a table using a two-phase architecture:
 *
 * Phase A – Preflight:
 * - Read all expected target columns and physical schema.
 * - Read all ownership records for this migration and table.
 * - Identify physically existing columns lacking ownership records and abort immediately
 *   before modifying the target table.
 * - Validate all tracked existing columns against expected types, nullability, and defaults.
 *
 * Phase B – Apply:
 * - Add only missing columns to the target table.
 * - Record ownership in `_migration_column_ownership` immediately after each successful addition.
 * - Never infer ownership from matching definitions or column names.
 */
export async function addMigrationColumns(queryInterface, tableName, migrationName, expectedColumns) {
  const sequelize = queryInterface.sequelize;
  await ensureColumnOwnershipTable(sequelize);

  // ========================================================
  // Phase A – Preflight Validation (Strict Pre-Modification Checks)
  // ========================================================

  // 1. Read existing physical table columns
  const existingColumns = await queryInterface.describeTable(tableName);

  // 2. Read information_schema columns for precise metadata (types, defaults, nullability)
  const [infoCols] = await sequelize.query(
    `SELECT
       COLUMN_NAME AS columnName,
       COLUMN_DEFAULT AS columnDefault,
       EXTRA AS extra,
       DATA_TYPE AS dataType,
       COLUMN_TYPE AS columnType,
       IS_NULLABLE AS isNullable
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    { replacements: [tableName] }
  );
  const infoMap = new Map(infoCols.map((col) => [col.columnName, col]));

  // 3. Read all ownership records for this migration and table
  const [trackedRows] = await sequelize.query(
    `SELECT \`column_name\` AS columnName
     FROM \`_migration_column_ownership\`
     WHERE \`migration_name\` = ? AND \`table_name\` = ?`,
    { replacements: [migrationName, tableName] }
  );
  const ownedColumns = new Set(trackedRows.map((r) => r.columnName));

  // 4. Preflight Guard: Identify physically existing columns without ownership records
  for (const colName of Object.keys(expectedColumns)) {
    if (existingColumns[colName] && !ownedColumns.has(colName)) {
      throw new Error(
        `Migration preflight validation failed for table "${tableName}": column "${colName}" exists physically in the database but is not tracked in "_migration_column_ownership". Ownership cannot be established reliably (it may be an untracked column from an incomplete migration execution or a pre-existing column). Manual schema inspection is required.`
      );
    }
  }

  // 5. Preflight Guard: Validate all tracked existing columns against their expected definitions
  for (const [colName, expected] of Object.entries(expectedColumns)) {
    if (existingColumns[colName] && ownedColumns.has(colName)) {
      const actual = existingColumns[colName];
      const info = infoMap.get(colName);

      if (!info) {
        throw new Error(
          `Migration preflight validation failed for table "${tableName}": metadata missing for existing column "${colName}". Manual schema inspection is required.`
        );
      }

      // Nullability validation
      if (expected.allowNull !== undefined) {
        const actualAllowNull = actual.allowNull === true || info.isNullable === 'YES';
        if (actualAllowNull !== expected.allowNull) {
          throw new Error(
            `Migration preflight validation failed for table "${tableName}": column "${colName}" allowNull mismatch (expected ${expected.allowNull}, found ${actualAllowNull}). Manual schema inspection is required.`
          );
        }
      }

      // Data type validation
      if (expected.typeMatch) {
        const actualType = String(actual.type || info.columnType || '').trim();
        const matches = expected.typeMatch instanceof RegExp
          ? expected.typeMatch.test(actualType)
          : actualType.toUpperCase() === String(expected.typeMatch).toUpperCase();

        if (!matches) {
          throw new Error(
            `Migration preflight validation failed for table "${tableName}": column "${colName}" has incompatible type "${actualType}" (expected pattern ${expected.typeMatch}). Manual schema inspection is required.`
          );
        }
      }

      // Default value validation
      if (expected.defaultValue !== undefined) {
        const actualRawDefault = info.columnDefault;

        if (expected.defaultValue === null) {
          if (actualRawDefault !== null) {
            throw new Error(
              `Migration preflight validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected null, found "${actualRawDefault}"). Manual schema inspection is required.`
            );
          }
        } else if (typeof expected.defaultValue === 'number') {
          const actualNum = actualRawDefault !== null ? Number(actualRawDefault) : NaN;
          if (Number.isNaN(actualNum) || actualNum !== expected.defaultValue) {
            throw new Error(
              `Migration preflight validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected ${expected.defaultValue}, found "${actualRawDefault}"). Manual schema inspection is required.`
            );
          }
        } else {
          // String / ENUM default: normalize outer quotes
          const normalizedActual = String(actualRawDefault || '').replace(/^['"]|['"]$/g, '').trim();
          const normalizedExpected = String(expected.defaultValue).replace(/^['"]|['"]$/g, '').trim();

          if (normalizedActual !== normalizedExpected) {
            throw new Error(
              `Migration preflight validation failed for table "${tableName}": column "${colName}" defaultValue mismatch (expected "${expected.defaultValue}", found "${actualRawDefault}"). Manual schema inspection is required.`
            );
          }
        }
      }
    }
  }

  // ========================================================
  // Phase B – Apply (Add Missing Columns and Record Ownership)
  // ========================================================
  for (const [colName, expected] of Object.entries(expectedColumns)) {
    if (!existingColumns[colName]) {
      // Add missing column
      await queryInterface.addColumn(tableName, colName, expected.definition);

      // Record ownership immediately after each successful addition only if not already tracked
      if (!ownedColumns.has(colName)) {
        await sequelize.query(
          `INSERT INTO \`_migration_column_ownership\`
             (\`migration_name\`, \`table_name\`, \`column_name\`, \`created_at\`)
           VALUES (?, ?, ?, NOW())`,
          { replacements: [migrationName, tableName, colName] }
        );
        ownedColumns.add(colName);
      }
    }
  }
}

/**
 * Remove columns created by this migration during rollback.
 * Conservative rollback strategy: Only drops columns explicitly verified to have been created
 * by this migration via `_migration_column_ownership`. If ownership tracking metadata cannot
 * be established, fails safely to prevent deleting pre-existing production columns.
 */
export async function removeMigrationColumns(queryInterface, tableName, migrationName, columnNames) {
  const sequelize = queryInterface.sequelize;
  const hasTable = await tableExists(queryInterface, tableName);
  if (!hasTable) {
    return;
  }

  const hasTrackingTable = await tableExists(queryInterface, '_migration_column_ownership');
  if (!hasTrackingTable) {
    throw new Error(
      `Migration rollback aborted for table "${tableName}": column ownership tracking table "_migration_column_ownership" does not exist. Rollback cannot safely determine whether columns pre-existed in production.`
    );
  }

  // Validate tracking table schema before relying on it during rollback
  await ensureColumnOwnershipTable(sequelize);

  const [rows] = await sequelize.query(
    `SELECT \`column_name\` AS columnName
     FROM \`_migration_column_ownership\`
     WHERE \`migration_name\` = ? AND \`table_name\` = ?`,
    { replacements: [migrationName, tableName] }
  );

  const ownedColumns = new Set(rows.map((r) => r.columnName));
  const currentColumns = await queryInterface.describeTable(tableName);

  const ordered = Array.isArray(columnNames)
    ? [...columnNames].reverse()
    : Object.keys(columnNames).reverse();

  for (const colName of ordered) {
    if (currentColumns[colName]) {
      if (ownedColumns.has(colName)) {
        await queryInterface.removeColumn(tableName, colName);
        await sequelize.query(
          `DELETE FROM \`_migration_column_ownership\`
           WHERE \`migration_name\` = ? AND \`table_name\` = ? AND \`column_name\` = ?`,
          { replacements: [migrationName, tableName, colName] }
        );
      }
      // If not in ownedColumns: untracked or pre-existing column, preserve it without dropping.
    }
  }
}
