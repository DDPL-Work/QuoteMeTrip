-- ==============================================================================
-- QUOTEMETRIP DATABASE DUMMY DATA CLEANUP: TRANSACTIONAL SAFEGUARDED SCRIPT
-- TARGET: LOCAL DEVELOPMENT DOCKER MYSQL ONLY (`troublefree_holiday`)
-- DO NOT EXECUTE DIRECTLY WITHOUT PRIOR REVIEW AND APPROVAL
-- ==============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_quotemetrip_cleanup_dummy_data$$

CREATE PROCEDURE sp_quotemetrip_cleanup_dummy_data(IN p_dry_run TINYINT(1))
proc_cleanup: BEGIN
    DECLARE v_error_occurred TINYINT(1) DEFAULT 0;
    DECLARE v_error_msg TEXT DEFAULT '';
    
    -- Error Handler to trigger automatic rollback on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        ROLLBACK;
        SELECT 'ABORTED / ROLLED BACK DUE TO SQL EXCEPTION' AS status, v_error_msg AS error_details;
    END;

    -- Ensure we are on InnoDB and Foreign Key Checks stay enabled
    SET foreign_key_checks = 1;

    START TRANSACTION;

    -- -------------------------------------------------------------------------
    -- STEP 1: POPULATE DETERMINISTIC TEST DATASETS
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_del_users;
    CREATE TEMPORARY TABLE tmp_del_users (id INT UNSIGNED PRIMARY KEY);

    INSERT INTO tmp_del_users (id)
    SELECT id FROM users
    WHERE (
        email LIKE '%@example.com' 
        OR email LIKE 'verify_%' 
        OR email LIKE 'biz-%' 
        OR email LIKE 'msg-%' 
        OR email LIKE 'ttl-%'
    ) AND id NOT IN (10, 11, 12, 13, 219, 448);

    DROP TEMPORARY TABLE IF EXISTS tmp_del_agencies;
    CREATE TEMPORARY TABLE tmp_del_agencies (id INT UNSIGNED PRIMARY KEY);

    INSERT INTO tmp_del_agencies (id)
    SELECT ap.id 
    FROM agency_profiles ap
    JOIN tmp_del_users tu ON ap.user_id = tu.id
    WHERE ap.id != 3;

    DROP TEMPORARY TABLE IF EXISTS tmp_del_requests;
    CREATE TEMPORARY TABLE tmp_del_requests (id INT UNSIGNED PRIMARY KEY);

    INSERT INTO tmp_del_requests (id)
    SELECT tr.id
    FROM travel_requests tr
    WHERE tr.id NOT IN (6, 7, 8, 9, 10, 11, 78, 92, 96, 97, 120, 187, 188, 189);

    -- -------------------------------------------------------------------------
    -- STEP 2: PRE-DELETION SANITY CHECKS (ABORT ON VIOLATIONS)
    -- -------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM tmp_del_users WHERE id IN (10, 11, 12, 13, 219, 448)) THEN
        ROLLBACK;
        SELECT 'ABORTED: Protected users detected in deletion queue!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF EXISTS (SELECT 1 FROM tmp_del_agencies WHERE id = 3) THEN
        ROLLBACK;
        SELECT 'ABORTED: Protected agency ID 3 detected in deletion queue!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF EXISTS (SELECT 1 FROM tmp_del_requests WHERE id IN (6, 7, 8, 9, 10, 11, 78, 92, 96, 97, 120, 187, 188, 189)) THEN
        ROLLBACK;
        SELECT 'ABORTED: Protected travel requests detected in deletion queue!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM tmp_del_users) != 444 THEN
        ROLLBACK;
        SELECT 'ABORTED: Test users count mismatch (expected 444)' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM tmp_del_agencies) != 198 THEN
        ROLLBACK;
        SELECT 'ABORTED: Test agency profiles count mismatch (expected 198)' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM tmp_del_requests) != 175 THEN
        ROLLBACK;
        SELECT 'ABORTED: Test travel requests count mismatch (expected 175)' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM traveller_profiles WHERE user_id IN (SELECT id FROM tmp_del_users)) != 231 THEN
        ROLLBACK;
        SELECT 'ABORTED: Test traveller profiles count mismatch (expected 231)' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    -- -------------------------------------------------------------------------
    -- STEP 3: PERFORM ORDERED BOTTOM-UP DELETIONS (RESPECTING FOREIGN KEYS)
    -- -------------------------------------------------------------------------

    -- 1. Push Tokens (0 rows)
    DELETE pt FROM push_tokens pt
    JOIN tmp_del_users tu ON pt.user_id = tu.id;

    -- 2. Auth Sessions (454 rows)
    DELETE s FROM auth_sessions s
    JOIN tmp_del_users tu ON s.user_id = tu.id;

    -- 3. Notifications (11,112 rows)
    DELETE n FROM notifications n
    JOIN tmp_del_users tu ON n.user_id = tu.id;

    -- 4. Messages (73 rows)
    DELETE m FROM messages m
    WHERE m.conversation_id IN (
        SELECT c.id FROM conversations c
        WHERE c.agency_id IN (SELECT id FROM tmp_del_agencies)
           OR c.travel_request_id IN (SELECT id FROM tmp_del_requests)
    );

    -- 5. Conversations (149 rows)
    DELETE c FROM conversations c
    WHERE c.agency_id IN (SELECT id FROM tmp_del_agencies)
       OR c.travel_request_id IN (SELECT id FROM tmp_del_requests);

    -- 6. Commissions (15 rows)
    DELETE com FROM commissions com
    WHERE com.agency_id IN (SELECT id FROM tmp_del_agencies);

    -- 7. Ratings (0 rows)
    DELETE r FROM ratings r
    WHERE r.agency_id IN (SELECT id FROM tmp_del_agencies)
       OR r.travel_request_id IN (SELECT id FROM tmp_del_requests);

    -- 8. Jobs (15 rows) - MUST BE DELETED BEFORE QUOTATIONS (due to jobs_ibfk_2 ON DELETE RESTRICT)
    DELETE j FROM jobs j
    WHERE j.agency_id IN (SELECT id FROM tmp_del_agencies)
       OR j.travel_request_id IN (SELECT id FROM tmp_del_requests);

    -- 9. Quotation Items (301 rows)
    DELETE qi FROM quotation_items qi
    WHERE qi.quotation_id IN (
        SELECT q.id FROM quotations q
        WHERE q.agency_id IN (SELECT id FROM tmp_del_agencies)
           OR q.travel_request_id IN (SELECT id FROM tmp_del_requests)
    );

    -- 10. Quotations (155 rows) - DELETED AFTER JOBS
    DELETE q FROM quotations q
    WHERE q.agency_id IN (SELECT id FROM tmp_del_agencies)
       OR q.travel_request_id IN (SELECT id FROM tmp_del_requests);

    -- 11. Travel Request Agencies (13,990 rows)
    DELETE tra FROM travel_request_agencies tra
    WHERE tra.travel_request_id IN (SELECT id FROM tmp_del_requests)
       OR tra.agency_id IN (SELECT id FROM tmp_del_agencies);

    -- 12. Travel Request Days (5 rows)
    DELETE trd FROM travel_request_days trd
    WHERE trd.travel_request_id IN (SELECT id FROM tmp_del_requests);

    -- 13. Travel Requests (175 rows) - MUST BE DELETED BEFORE ROUTES
    DELETE tr FROM travel_requests tr
    WHERE tr.id IN (SELECT id FROM tmp_del_requests);

    -- 14. Route Stops (508 rows)
    DELETE rs FROM route_stops rs
    WHERE rs.route_id IN (
        SELECT r.id FROM routes r
        JOIN tmp_del_users tu ON r.traveller_id = tu.id
        WHERE r.traveller_id NOT IN (10, 11, 12, 13, 219, 448)
    );

    -- 15. Routes (175 rows) - DELETED AFTER TRAVEL REQUESTS
    DELETE r FROM routes r
    JOIN tmp_del_users tu ON r.traveller_id = tu.id
    WHERE r.traveller_id NOT IN (10, 11, 12, 13, 219, 448);

    -- 16. Agency Documents (1 row)
    DELETE ad FROM agency_documents ad
    WHERE ad.agency_id IN (SELECT id FROM tmp_del_agencies);

    -- 17. Agency Coverages & Capabilities (0 rows)
    DELETE ac FROM agency_coverages ac WHERE ac.agency_id IN (SELECT id FROM tmp_del_agencies);
    DELETE acap FROM agency_capabilities acap WHERE acap.agency_id IN (SELECT id FROM tmp_del_agencies);

    -- 18. Agency Memberships (186 rows)
    DELETE am FROM agency_memberships am
    WHERE am.agency_id IN (SELECT id FROM tmp_del_agencies);

    -- 19. Membership Plans (18 test plans)
    DELETE mp FROM membership_plans mp
    WHERE mp.id IN (7, 8, 9, 10, 11, 12, 13, 14, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33);

    -- 20. Agency Profiles (198 rows)
    DELETE ap FROM agency_profiles ap
    WHERE ap.id IN (SELECT id FROM tmp_del_agencies);

    -- 21. Traveller Profiles (231 rows)
    DELETE tp FROM traveller_profiles tp
    JOIN tmp_del_users tu ON tp.user_id = tu.id;

    -- 22. Users (444 rows)
    DELETE u FROM users u
    WHERE u.id IN (SELECT id FROM tmp_del_users);

    -- -------------------------------------------------------------------------
    -- STEP 4: PRE-COMMIT POST-VERIFICATION CHECKPOINT
    -- -------------------------------------------------------------------------
    IF (SELECT COUNT(*) FROM users) != 6 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining user count is not exactly 6!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM traveller_profiles) != 4 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining traveller profiles count is not exactly 4!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM agency_profiles) != 1 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining agency profile count is not exactly 1!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM travel_requests) != 14 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining travel requests count is not exactly 14!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM routes) != 14 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining routes count is not exactly 14!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM quotations) != 2 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining quotations count is not exactly 2!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM jobs) != 1 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining job count is not exactly 1!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM agency_memberships) != 1 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining agency memberships count is not exactly 1!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM membership_plans) != 8 THEN
        ROLLBACK;
        SELECT 'ABORTED: Final remaining membership plans count is not exactly 8!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    IF (SELECT COUNT(*) FROM travel_guide_articles) != 1 THEN
        ROLLBACK;
        SELECT 'ABORTED: Travel guide articles modified!' AS error_message;
        LEAVE proc_cleanup;
    END IF;

    -- Dry Run Check: If p_dry_run = 1, always rollback safely
    IF p_dry_run = 1 THEN
        ROLLBACK;
        SELECT 'DRY RUN COMPLETED SUCCESSFULLY: All checks passed. Rolled back without writing.' AS status;
    ELSE
        COMMIT;
        SELECT 'CLEANUP COMMITTED SUCCESSFULLY: Database purged of dummy test data.' AS status;
    END IF;

END proc_cleanup$$

DELIMITER ;
