/**
 * Read-only Database Audit & Test Data Identification Script
 * (Workstream 4 — Phase A & B)
 *
 * Safety boundaries:
 * 1. Confirms connection is strictly loopback (127.0.0.1 or localhost).
 * 2. Refuses execution if NODE_ENV=production or DB_HOST is non-loopback.
 * 3. READ-ONLY: Never executes DELETE, DROP, TRUNCATE, or ALTER statements.
 * 4. Categorizes records into:
 *    - Confirmed test fixtures
 *    - Likely test records
 *    - Ambiguous records
 *    - Confirmed legitimate records
 * 5. Prepares proposed dependency cleanup order and dry-run report.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getDatabaseConfig, isLoopbackHost } from '../src/config/database.js';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';

async function runAudit() {
  const config = getDatabaseConfig();

  console.log('='.repeat(70));
  console.log('QuoteMeTrip — Database Safety & Test-Data Read-Only Audit');
  console.log('='.repeat(70));

  // 1. Safety Guard Checks
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: Cannot run audit script in production environment.');
  }

  if (!isLoopbackHost(config.host)) {
    throw new Error(`SECURITY VIOLATION: Host "${config.host}" is not a verified loopback address.`);
  }

  console.log(`[OK] Verified Host: ${config.host} (Loopback confirmed)`);
  console.log(`[OK] Target Database: ${config.database}`);
  console.log(`[OK] Port: ${config.port}`);
  console.log('-'.repeat(70));

  const seq = getSequelize();
  await seq.authenticate();

  // 2. Full Table Inventory
  console.log('\n--- 1. TABLE INVENTORY & ROW COUNTS ---');
  const [tables] = await seq.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0])[0];
  const tableCounts = {};

  for (const t of tables) {
    const tableName = t[tableKey];
    const [[{ count }]] = await seq.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    tableCounts[tableName] = count;
    console.log(`  ${tableName.padEnd(30)} : ${count} rows`);
  }

  // 3. Identification of Users
  console.log('\n--- 2. USER ANALYSIS & TEST DATA CANDIDATES ---');
  const [allUsers] = await seq.query(`
    SELECT id, email, role, status, created_at 
    FROM users 
    ORDER BY id ASC
  `);

  const legitimateUsers = [];
  const confirmedTestUsers = [];
  const ambiguousUsers = [];

  for (const u of allUsers) {
    const email = (u.email || '').toLowerCase();
    // Indicators of synthetic test users:
    // e.g. @example.com, verify_*, biz-*, msg-*
    if (
      email.endsWith('@example.com') ||
      email.includes('example') ||
      email.startsWith('verify_') ||
      email.startsWith('biz-') ||
      email.startsWith('msg-') ||
      email.startsWith('ttl-')
    ) {
      confirmedTestUsers.push(u);
    } else if (u.role === 'admin' || email.endsWith('@troublefree.com') || email.endsWith('@quotemetrip.com')) {
      legitimateUsers.push(u);
    } else {
      ambiguousUsers.push(u);
    }
  }

  console.log(`  Total Users: ${allUsers.length}`);
  console.log(`  Confirmed Test Users: ${confirmedTestUsers.length}`);
  console.log(`  Confirmed Legitimate / Admin Users: ${legitimateUsers.length}`);
  console.log(`  Ambiguous Users requiring review: ${ambiguousUsers.length}`);

  console.log('\n  Legitimate / Admin Users found:');
  for (const u of legitimateUsers) {
    console.log(`    - ID #${u.id} | ${u.email} | Role: ${u.role} | Status: ${u.status}`);
  }

  if (ambiguousUsers.length > 0) {
    console.log('\n  Ambiguous Users requiring review:');
    for (const u of ambiguousUsers) {
      console.log(`    - ID #${u.id} | ${u.email} | Role: ${u.role} | Status: ${u.status}`);
    }
  }

  // 4. Agency Profiles Analysis
  console.log('\n--- 3. AGENCY PROFILES ANALYSIS ---');
  const [allAgencies] = await seq.query(`
    SELECT ap.id, ap.user_id, ap.agency_name, ap.status, u.email
    FROM agency_profiles ap
    JOIN users u ON ap.user_id = u.id
    ORDER BY ap.id ASC
  `);

  const confirmedTestAgencies = [];
  const legitimateAgencies = [];

  for (const a of allAgencies) {
    const name = a.agency_name || '';
    const email = (a.email || '').toLowerCase();
    if (
      name.startsWith('Msg Agency') ||
      name.startsWith('TTL Travel Agency') ||
      name.startsWith('Verify Agency') ||
      name.includes('mv99') ||
      email.endsWith('@example.com')
    ) {
      confirmedTestAgencies.push(a);
    } else {
      legitimateAgencies.push(a);
    }
  }

  console.log(`  Total Agency Profiles: ${allAgencies.length}`);
  console.log(`  Confirmed Test Agencies: ${confirmedTestAgencies.length}`);
  console.log(`  Legitimate Agencies: ${legitimateAgencies.length}`);
  if (legitimateAgencies.length > 0) {
    console.log('  Legitimate Agencies list:');
    for (const a of legitimateAgencies) {
      console.log(`    - ID #${a.id} | ${a.business_name} | Email: ${a.email} | Status: ${a.status}`);
    }
  }

  // 5. Membership Plans Analysis
  console.log('\n--- 4. MEMBERSHIP PLANS ANALYSIS ---');
  const [plans] = await seq.query(`
    SELECT id, name, slug, price, currency, duration_days, status, created_at
    FROM membership_plans
    ORDER BY id ASC
  `);

  const confirmedTestPlans = [];
  const standardPlans = [];

  for (const p of plans) {
    if (
      p.slug.startsWith('phase') ||
      p.name.startsWith('Phase') ||
      p.name.includes('Verify') ||
      p.slug.includes('mv') ||
      p.slug.includes('test')
    ) {
      confirmedTestPlans.push(p);
    } else {
      standardPlans.push(p);
    }
  }

  console.log(`  Total Membership Plans: ${plans.length}`);
  console.log(`  Confirmed Test Plans: ${confirmedTestPlans.length}`);
  console.log(`  Standard / Seed Plans to KEEP: ${standardPlans.length}`);
  for (const p of standardPlans) {
    console.log(`    - ID #${p.id} | ${p.name} (${p.slug}) | $${Number(p.price || 0).toFixed(2)} | Status: ${p.status}`);
  }

  // 6. Dependent Data Counts for Test Users
  console.log('\n--- 5. RELATIONAL DEPENDENCY IMPACT FOR CONFIRMED TEST DATA ---');
  const testUserIds = confirmedTestUsers.map((u) => u.id);

  if (testUserIds.length > 0) {
    const idList = testUserIds.join(',');

    const [[{ count: agencyMembershipsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM agency_memberships WHERE agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList}))`,
    );
    const [[{ count: agencyDocsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM agency_documents WHERE agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList}))`,
    );
    const [[{ count: travelRequestsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM travel_requests WHERE traveller_id IN (${idList})`,
    );
    const [[{ count: matchCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM travel_request_agencies WHERE agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList})) OR travel_request_id IN (SELECT id FROM travel_requests WHERE traveller_id IN (${idList}))`,
    );
    const [[{ count: quotationsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM quotations WHERE agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList}))`,
    );
    const [[{ count: conversationsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM conversations WHERE traveller_id IN (${idList}) OR agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList}))`,
    );
    const [[{ count: jobsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM jobs WHERE traveller_id IN (${idList}) OR agency_id IN (SELECT id FROM agency_profiles WHERE user_id IN (${idList}))`,
    );
    const [[{ count: notifsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id IN (${idList})`,
    );
    const [[{ count: sessionsCount }]] = await seq.query(
      `SELECT COUNT(*) as count FROM auth_sessions WHERE user_id IN (${idList})`,
    );

    console.log(`  Dependent records owned by candidate test accounts:`);
    console.log(`    - agency_memberships     : ${agencyMembershipsCount}`);
    console.log(`    - agency_documents       : ${agencyDocsCount}`);
    console.log(`    - travel_requests        : ${travelRequestsCount}`);
    console.log(`    - travel_request_agencies: ${matchCount}`);
    console.log(`    - quotations             : ${quotationsCount}`);
    console.log(`    - conversations          : ${conversationsCount}`);
    console.log(`    - jobs                   : ${jobsCount}`);
    console.log(`    - notifications          : ${notifsCount}`);
    console.log(`    - auth_sessions          : ${sessionsCount}`);
  }

  // 7. Proposed Safe Deletion Order (FK dependency order)
  console.log('\n--- 6. PROPOSED SAFE CLEANUP EXECUTION PLAN (UPON APPROVAL) ---');
  console.log('  Step 1: Create verified mysqldump backup outside repository:');
  console.log('          mysqldump -h 127.0.0.1 -P 3307 -u <user> -p troublefree_holiday > C:\\Users\\ashish kathait\\backups\\troublefree_holiday_backup_<timestamp>.sql');
  console.log('  Step 2: Execute bounded cascade in correct foreign key order:');
  console.log('          1. travel_request_agencies (dependent matches)');
  console.log('          2. quotation_items (dependent lines)');
  console.log('          3. quotations');
  console.log('          4. messages');
  console.log('          5. conversations');
  console.log('          6. jobs & commissions');
  console.log('          7. travel_request_days & travel_requests');
  console.log('          8. route_stops & routes (unreferenced test routes)');
  console.log('          9. agency_documents & agency_coverages & agency_capabilities');
  console.log('         10. agency_memberships');
  console.log('         11. test membership_plans (Phase 6 msg..., Phase5 Verify, etc.)');
  console.log('         12. agency_profiles (test agencies)');
  console.log('         13. traveller_profiles (test travellers)');
  console.log('         14. auth_sessions, auth_identities, notifications, push_tokens');
  console.log('         15. users (confirmed test accounts)');
  console.log('  Step 3: Verification of table integrity and application functionality.');
  console.log('\n[STOP] STATUS: Dry-run audit complete. No database records were modified or deleted.');
  console.log('='.repeat(70));

  await closeDatabase();
}

runAudit().catch((err) => {
  console.error('[ERROR] Audit failed:', err.message);
  process.exit(1);
});
