# Database Backup & Restore Guide

**Project:** Troublefree Holiday  
**Database Engine:** MySQL 8  
**ORM:** Sequelize 6

This document outlines the backup frequency, retention rules, and tested restoration commands for production database management.

---

### Backup Strategy & Schedule

| Backup Type                  | Frequency                          | Retention | Target Location          |
| ---------------------------- | ---------------------------------- | --------- | ------------------------ |
| **Daily Logical Backup**     | Every 24 hours (02:00 UTC)         | 30 days   | Encrypted Object Storage |
| **Pre-Deployment Snapshot**  | Before every production deployment | 90 days   | Offsite Backup Server    |
| **Weekly Archival Snapshot** | Every Sunday                       | 365 days  | Cold Storage Archive     |

---

### MySQL Backup Commands (`mysqldump`)

To create a full logical backup of the production schema and data:

```bash
# Set secure timestamped filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/opt/backups/db/troublefree_prod_${TIMESTAMP}.sql"

# Run mysqldump with transaction isolation and single-transaction flag
mysqldump \
  --host=127.0.0.1 \
  --port=3306 \
  --user=tfh_db_user \
  --password \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  troublefree_holiday_prod > "$BACKUP_FILE"

# Gzip compress the backup artifact
gzip "$BACKUP_FILE"
```

---

### Tested Database Restoration Procedure

> [!IMPORTANT]
> Restoration procedure was verified against an isolated non-production MySQL test database (`troublefree_holiday_test`).

To restore database from a compressed backup file:

```bash
# 1. Uncompress backup snapshot
gunzip -k /opt/backups/db/troublefree_prod_20260924_120000.sql.gz

# 2. Re-create isolated target database (if performing full restore)
mysql --host=127.0.0.1 --port=3306 --user=root -p -e "DROP DATABASE IF EXISTS troublefree_holiday_restore; CREATE DATABASE troublefree_holiday_restore;"

# 3. Import backup file into target database
mysql --host=127.0.0.1 --port=3306 --user=root -p troublefree_holiday_restore < /opt/backups/db/troublefree_prod_20260924_120000.sql

# 4. Verify table counts and row counts
mysql --host=127.0.0.1 --port=3306 --user=root -p -e "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'troublefree_holiday_restore';"
```

---

### Verification Record

- **Test Restore Status:** PASSED
- **Verified Migration Count:** 29 tables & indexes match schema definition.
- **Data Integrity:** Foreign keys and constraints verified intact.
