# Production Rollback Plan

**Project:** Troublefree Holiday  
**Phase:** 9 — Operations & Deployment

This document describes step-by-step procedure for rolling back code, environment, database, and reverse-proxy configurations in the event of an emergency during release.

---

### 1. Application Code Rollback (Backend & Frontends)

If a critical error or crash occurs post-deployment:

1. **Rollback Node.js Backend Service:**

   ```bash
   # Revert git commit to previous stable release tag
   git checkout tags/v1.0.0-stable

   # Re-install dependencies and restart backend process (PM2)
   npm install --omit=dev
   pm2 reload troublefree-backend --update-env
   ```

2. **Rollback Frontend Static Builds:**
   ```bash
   # Re-deploy previous build artifacts to Nginx web root directory
   cp -r /opt/backups/builds/v1.0.0/traveller/* /var/www/troublefree/traveller/
   cp -r /opt/backups/builds/v1.0.0/agency/* /var/www/troublefree/agency/
   cp -r /opt/backups/builds/v1.0.0/admin/* /var/www/troublefree/admin/
   ```

---

### 2. Database Rollback Procedures

> [!CAUTION]
> Never blindly run `npm run db:migrate:undo` in production without verifying data compatibility.

If schema migration rollback is required:

1. **Assess Data Compatibility:**
   - Determine if new columns or tables contain production user data.
   - Export newly generated data before dropping tables or columns.

2. **Revert Migration Steps safely:**

   ```bash
   # Revert the last applied migration step
   node scripts/db-migrate-undo.js
   ```

3. **Full Database Restoration (If Schema Corruption Occurs):**
   ```bash
   # Import pre-release MySQL database backup snapshot
   mysql -u tfh_db_user -p troublefree_holiday_prod < /opt/backups/db/pre_release_backup.sql
   ```

---

### 3. Nginx Reverse Proxy Rollback

If proxy rules, SSL, or routing headers fail:

```bash
# Restore previous Nginx configuration file
cp /etc/nginx/sites-available/troublefree.conf.bak /etc/nginx/sites-available/troublefree.conf

# Test syntax and reload Nginx service
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. Verification After Rollback

1. Execute health checks:
   ```bash
   curl -I https://api.troublefreeholiday.com/api/v1/health/liveness
   curl -I https://api.troublefreeholiday.com/api/v1/health/readiness
   ```
2. Verify frontend SPA routing and web app loads cleanly without console errors.
