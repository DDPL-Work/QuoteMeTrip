-- ==============================================================================
-- QUOTEMETRIP DATABASE DUMMY DATA CLEANUP: DRY-RUN VERIFICATION SCRIPT
-- STRICTLY READ-ONLY: NO DATA MODIFICATION (NO DELETE, NO DROP, NO TRUNCATE)
-- ==============================================================================

USE `troublefree_holiday`;

-- 1. Verify Protected Accounts (Must return 5)
SELECT '1. PROTECTED ACCOUNTS' AS step, id, email, role, status 
FROM users 
WHERE id IN (10, 11, 12, 13, 448);

-- 2. Verify Candidate Test Users to Delete (Must be 445)
SELECT '2. TEST USERS BREAKDOWN' AS step, role, COUNT(*) AS count
FROM users 
WHERE id NOT IN (10, 11, 12, 13, 448)
GROUP BY role;

-- 3. Verify Candidate Test Agency Profiles (Must be 198)
SELECT '3. TEST AGENCY PROFILES' AS step, COUNT(*) AS count
FROM agency_profiles
WHERE user_id NOT IN (10, 11, 12, 13, 448);

-- 4. Verify Candidate Test Traveller Profiles (Must be 232)
SELECT '4. TEST TRAVELLER PROFILES' AS step, COUNT(*) AS count
FROM traveller_profiles
WHERE user_id NOT IN (10, 11, 12, 13, 448);

-- 5. Verify Test Travel Requests (Excluding protected users: 189 - 13 = 176)
SELECT '5. TEST TRAVEL REQUESTS' AS step, COUNT(*) AS count
FROM travel_requests
WHERE traveller_id NOT IN (10, 11, 12, 13, 448);

-- 6. Verify Test Membership Plans Proposed For Deletion (18 plans)
SELECT '6. TEST MEMBERSHIP PLANS' AS step, COUNT(*) AS count
FROM membership_plans
WHERE id IN (7, 8, 9, 10, 11, 12, 13, 14, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33);

-- 7. Verify Zero Protected Dependencies on Deletion Membership Plans
SELECT '7. PROTECTED MEMBERSHIPS ON TEST PLANS' AS step, COUNT(*) AS count
FROM agency_memberships
WHERE agency_id = 3 AND plan_id IN (7, 8, 9, 10, 11, 12, 13, 14, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33);

-- 8. Verify Protected Active Job & Quotation (Job 1, Quotation 2, TR 11)
SELECT '8. PROTECTED ACTIVE BUSINESS DATA' AS step,
  (SELECT COUNT(*) FROM jobs WHERE id = 1 AND agency_id = 3) AS protected_jobs,
  (SELECT COUNT(*) FROM quotations WHERE agency_id = 3) AS protected_quotations,
  (SELECT COUNT(*) FROM travel_requests WHERE traveller_id IN (10, 11, 12, 13, 448)) AS protected_requests;

-- 9. Storage Engines Check (All 33 must be InnoDB)
SELECT '9. INNODB ENGINES CHECK' AS step, ENGINE, COUNT(*) AS table_count
FROM information_schema.tables 
WHERE table_schema = 'troublefree_holiday'
GROUP BY ENGINE;

