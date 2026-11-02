-- ==============================================================================
-- QUOTEMETRIP DUMMY DATA CLEANUP: READ-ONLY SELECTION & VERIFICATION SCRIPT
-- STRICTLY READ-ONLY (NO DELETE / UPDATE / DROP / TRUNCATE)
-- TARGET: Local Docker MySQL `troublefree_holiday`
-- ==============================================================================

USE `troublefree_holiday`;

-- Temporary confirmed dummy datasets using explicit deterministic matching
DROP TEMPORARY TABLE IF EXISTS tmp_confirmed_test_users;
CREATE TEMPORARY TABLE tmp_confirmed_test_users (
    id INT UNSIGNED PRIMARY KEY
);

INSERT INTO tmp_confirmed_test_users (id)
SELECT id FROM users
WHERE (
    email LIKE '%@example.com' 
    OR email LIKE 'verify_%' 
    OR email LIKE 'biz-%' 
    OR email LIKE 'msg-%' 
    OR email LIKE 'ttl-%'
) AND id NOT IN (10, 11, 12, 13, 219, 448);

DROP TEMPORARY TABLE IF EXISTS tmp_confirmed_test_agencies;
CREATE TEMPORARY TABLE tmp_confirmed_test_agencies (
    id INT UNSIGNED PRIMARY KEY
);

INSERT INTO tmp_confirmed_test_agencies (id)
SELECT ap.id 
FROM agency_profiles ap
JOIN tmp_confirmed_test_users tu ON ap.user_id = tu.id
WHERE ap.id != 3;

DROP TEMPORARY TABLE IF EXISTS tmp_confirmed_test_requests;
CREATE TEMPORARY TABLE tmp_confirmed_test_requests (
    id INT UNSIGNED PRIMARY KEY
);

INSERT INTO tmp_confirmed_test_requests (id)
SELECT tr.id
FROM travel_requests tr
WHERE tr.id NOT IN (6, 7, 8, 9, 10, 11, 78, 92, 96, 97, 120, 187, 188, 189);

-- ------------------------------------------------------------------------------
-- 1. PROTECTED ACCOUNTS CHECK (Must return 0 violations)
-- ------------------------------------------------------------------------------
SELECT '1. PROTECTED USERS IN TEST SET (Must be 0)' AS checkpoint, COUNT(*) AS violations
FROM tmp_confirmed_test_users
WHERE id IN (10, 11, 12, 13, 219, 448);

SELECT '2. PROTECTED AGENCY IN TEST SET (Must be 0)' AS checkpoint, COUNT(*) AS violations
FROM tmp_confirmed_test_agencies
WHERE id = 3;

SELECT '3. PROTECTED REQUESTS IN TEST SET (Must be 0)' AS checkpoint, COUNT(*) AS violations
FROM tmp_confirmed_test_requests
WHERE id IN (6, 7, 8, 9, 10, 11, 78, 92, 96, 97, 120, 187, 188, 189);

-- ------------------------------------------------------------------------------
-- 2. EXACT ROW COUNTS PROPOSED FOR DELETION
-- ------------------------------------------------------------------------------

SELECT 'TABLE: push_tokens' AS target_table, COUNT(*) AS rows_to_delete
FROM push_tokens pt JOIN tmp_confirmed_test_users tu ON pt.user_id = tu.id;

SELECT 'TABLE: auth_identities' AS target_table, COUNT(*) AS rows_to_delete
FROM auth_identities ai JOIN tmp_confirmed_test_users tu ON ai.user_id = tu.id;

SELECT 'TABLE: auth_sessions' AS target_table, COUNT(*) AS rows_to_delete
FROM auth_sessions s JOIN tmp_confirmed_test_users tu ON s.user_id = tu.id;

SELECT 'TABLE: notifications' AS target_table, COUNT(*) AS rows_to_delete
FROM notifications n JOIN tmp_confirmed_test_users tu ON n.user_id = tu.id;

SELECT 'TABLE: messages' AS target_table, COUNT(*) AS rows_to_delete
FROM messages m
WHERE m.conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
       OR c.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests)
);

SELECT 'TABLE: conversations' AS target_table, COUNT(*) AS rows_to_delete
FROM conversations c
WHERE c.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
   OR c.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: commissions' AS target_table, COUNT(*) AS rows_to_delete
FROM commissions com WHERE com.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: ratings' AS target_table, COUNT(*) AS rows_to_delete
FROM ratings r WHERE r.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
   OR r.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: jobs' AS target_table, COUNT(*) AS rows_to_delete
FROM jobs j WHERE j.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
   OR j.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: quotation_items' AS target_table, COUNT(*) AS rows_to_delete
FROM quotation_items qi
WHERE qi.quotation_id IN (
    SELECT q.id FROM quotations q
    WHERE q.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
       OR q.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests)
);

SELECT 'TABLE: quotations' AS target_table, COUNT(*) AS rows_to_delete
FROM quotations q
WHERE q.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies)
   OR q.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: travel_request_agencies' AS target_table, COUNT(*) AS rows_to_delete
FROM travel_request_agencies tra
WHERE tra.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests)
   OR tra.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: travel_request_days' AS target_table, COUNT(*) AS rows_to_delete
FROM travel_request_days trd
WHERE trd.travel_request_id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: travel_requests' AS target_table, COUNT(*) AS rows_to_delete
FROM travel_requests tr
WHERE tr.id IN (SELECT id FROM tmp_confirmed_test_requests);

SELECT 'TABLE: route_stops' AS target_table, COUNT(*) AS rows_to_delete
FROM route_stops rs
WHERE rs.route_id IN (
    SELECT r.id FROM routes r
    JOIN tmp_confirmed_test_users tu ON r.traveller_id = tu.id
    WHERE r.traveller_id NOT IN (10, 11, 12, 13, 219, 448)
);

SELECT 'TABLE: routes' AS target_table, COUNT(*) AS rows_to_delete
FROM routes r
JOIN tmp_confirmed_test_users tu ON r.traveller_id = tu.id
WHERE r.traveller_id NOT IN (10, 11, 12, 13, 219, 448);

SELECT 'TABLE: agency_documents' AS target_table, COUNT(*) AS rows_to_delete
FROM agency_documents ad WHERE ad.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: agency_coverages' AS target_table, COUNT(*) AS rows_to_delete
FROM agency_coverages ac WHERE ac.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: agency_capabilities' AS target_table, COUNT(*) AS rows_to_delete
FROM agency_capabilities acap WHERE acap.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: agency_memberships' AS target_table, COUNT(*) AS rows_to_delete
FROM agency_memberships am WHERE am.agency_id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: membership_plans' AS target_table, COUNT(*) AS rows_to_delete
FROM membership_plans mp
WHERE mp.id IN (7, 8, 9, 10, 11, 12, 13, 14, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33);

SELECT 'TABLE: agency_profiles' AS target_table, COUNT(*) AS rows_to_delete
FROM agency_profiles ap WHERE ap.id IN (SELECT id FROM tmp_confirmed_test_agencies);

SELECT 'TABLE: traveller_profiles' AS target_table, COUNT(*) AS rows_to_delete
FROM traveller_profiles tp
JOIN tmp_confirmed_test_users tu ON tp.user_id = tu.id;

SELECT 'TABLE: users' AS target_table, COUNT(*) AS rows_to_delete
FROM tmp_confirmed_test_users;

-- Untouched Check: Travel Guide Tables
SELECT 'UNTOUCHED: Travel Guide Regions' AS table_check, COUNT(*) AS delete_count FROM travel_guide_regions WHERE 1=0;
SELECT 'UNTOUCHED: Travel Guide Destinations' AS table_check, COUNT(*) AS delete_count FROM travel_guide_destinations WHERE 1=0;
SELECT 'UNTOUCHED: Travel Guide Articles' AS table_check, COUNT(*) AS delete_count FROM travel_guide_articles WHERE 1=0;
