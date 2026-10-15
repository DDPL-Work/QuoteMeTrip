/**
 * Migration: add professional quotation builder document fields to `quotations`.
 *
 * Adds structured columns required for doc-based quotation builder:
 * - greeting: JSON (recipient, title, message)
 * - package_overview: JSON (tripId, destination, startDate, endDate, duration, adults, children, infants, luggage)
 * - itinerary_days: JSON (array of { dayNumber, weekday, date, title, description, city, hotelNotes, activityNotes })
 * - tax_rate: DECIMAL(5, 2)
 * - tax_amount: DECIMAL(12, 2)
 * - tax_label: STRING(190)
 * - payment_details: JSON (includePaymentDetails, bankName, accountHolder, accountNumber, ifsc, branch, instructions)
 * - inclusions: JSON (array of inclusion strings)
 * - exclusions: JSON (array of exclusion strings)
 * - terms_sections: JSON (array of { title, content, points, sortOrder, enabled })
 * - branding: JSON (logoUrl, agencyName, address, phone, email, footerBannerUrl)
 */
async function safeAddColumn(queryInterface, tableName, columnName, spec) {
  try {
    await queryInterface.addColumn(tableName, columnName, spec);
  } catch (err) {
    if (err.original?.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_FIELDNAME') {
      return;
    }
    throw err;
  }
}

export async function up(queryInterface, Sequelize) {
  await safeAddColumn(queryInterface, 'quotations', 'greeting', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'package_overview', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'itinerary_days', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'tax_rate', {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await safeAddColumn(queryInterface, 'quotations', 'tax_amount', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await safeAddColumn(queryInterface, 'quotations', 'tax_label', {
    type: Sequelize.STRING(190),
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'payment_details', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'inclusions', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'exclusions', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'terms_sections', {
    type: Sequelize.JSON,
    allowNull: true,
  });
  await safeAddColumn(queryInterface, 'quotations', 'branding', {
    type: Sequelize.JSON,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  const columns = [
    'greeting',
    'package_overview',
    'itinerary_days',
    'tax_rate',
    'tax_amount',
    'tax_label',
    'payment_details',
    'inclusions',
    'exclusions',
    'terms_sections',
    'branding',
  ];
  for (const col of columns) {
    try {
      await queryInterface.removeColumn('quotations', col);
    } catch {
      // Ignore if not present
    }
  }
}
