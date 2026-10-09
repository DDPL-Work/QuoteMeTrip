# Production Release Checklist

**Project:** QuoteMeTrip  
**Phase:** 9 — Deployment Readiness

---

### Pre-Deployment Verification

- [ ] **1. Environment Configuration Verified**
  - Production `.env` validated using `validateEnvironment()`.
  - Strong secrets generated for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
  - Zero development or default test passwords present in config.

- [ ] **2. Database Backup & Readiness Verified**
  - Full MySQL snapshot created before applying migrations.
  - Backup restoration verified against isolated test database.
  - Database pool settings tuned (`DB_POOL_MAX=20`).

- [ ] **3. Database Migrations Verified**
  - All 29 Sequelize schema migrations executed in order on production database (`npm run db:migrate`).
  - `sequelize.sync()` is NOT used anywhere in code.

- [ ] **4. Continuous Integration (CI) Clean**
  - All test suites passing (`npm test` across all workspaces).
  - ESLint checks passing (`npm run lint`).
  - Prettier formatting verified (`npm run format:check`).

- [ ] **5. Production Frontend Build**
  - Traveller Web, Agency Web, and Admin Web built with production API URLs (`npm run build`).
  - Static bundle assets verified.

- [ ] **6. Security Review Completed**
  - Helmet security headers active (CSP, HSTS, X-Content-Type-Options, Frameguard).
  - CORS strict origin validation active.
  - Rate limiters enabled on login, quotation submission, messaging, and admin actions.
  - HTTP-only, Secure, SameSite cookies enabled.

- [ ] **7. HTTPS & Nginx Configured**
  - TLS certificates configured for domain names.
  - HTTP to HTTPS redirect active.
  - WebSocket proxying (`Upgrade` / `Connection` headers) verified for Socket.IO.
  - Client max body size configured (5MB).

- [ ] **8. Provider Readiness Verified**
  - Weather, Email (SMTP), SMS, and Firebase credentials verified.
  - Non-blocking provider fallback confirmed working when credentials are not configured.

- [ ] **9. Health & Readiness Probes**
  - `GET /api/v1/health/liveness` returns HTTP 200 `status: ok`.
  - `GET /api/v1/health/readiness` returns HTTP 200 `status: ready`.

- [ ] **10. Post-Deployment Smoke Test**
  - Execute end-to-end smoke test covering traveller registration, route planning, travel request, agency quotation, job acceptance, rating, and admin approval.

- [ ] **11. UAT Sign-off**
  - All 18 scenarios in `docs/UAT-checklist.md` completed and signed off.

- [ ] **12. Rollback Verification**
  - Backup file and previous deployment commit tagged and accessible for immediate rollback if needed.
