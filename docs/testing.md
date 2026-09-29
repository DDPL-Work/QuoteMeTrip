# Testing

Test runner: Node's built-in test runner (`node --test`).

## Suites

| Location                                       | Scope                                                                                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/tests/unit/health.test.js`            | Health endpoint contract (incl. DB probe)                                                                                                                                                              |
| `backend/tests/unit/models.test.js`            | Model attributes, constraints, associations (no DB)                                                                                                                                                    |
| `backend/tests/unit/auth.test.js`              | Password hashing/policy, JWT sign/verify/expiry/type checks, token helpers, email normalization, public-user mapping, role validation                                                                  |
| `backend/tests/integration/auth.test.js`       | HTTP registration/login/refresh/rotation/replay/logout/logout-all/me, enumeration resistance, suspended/inactive, security matrix, Google (stubbed), corporate policy, rate limit, admin provisioning  |
| `backend/tests/integration/database.test.js`   | CRUD, uniqueness, FK integrity, CASCADE/RESTRICT/SET NULL, transactions                                                                                                                                |
| `backend/tests/integration/migrations.test.js` | Fresh migrate up → down → up round-trip                                                                                                                                                                |
| `backend/tests/integration/seeders.test.js`    | Seed idempotency, undo, re-seed                                                                                                                                                                        |
| `backend/tests/unit/route.test.js`             | Route-stop validation, recommended-day formula, request validation, status transitions, ownership enforcement                                                                                          |
| `backend/tests/integration/travel.test.js`     | HTTP profile/routes/requests flow: calculate, save, retrieve, draft CRUD, days, submit, ownership rejection, cancel, inline-route creation                                                             |
| `backend/tests/unit/matching.test.js`          | Matching eligibility/duplicate-prevention contracts, quotation/item validation, server totals, quotation transitions, ownership/contact-protection mappers, inbox query validation                     |
| `backend/tests/integration/quotations.test.js` | HTTP match-on-submit + events, eligibility exclusions, inbox pagination/detail, quotation draft/edit/submit/withdraw, duplicate/invalid-transition guards, traveller quotation views, cross-owner 404s |
| `backend/tests/unit/messaging.test.js`         | Message validation, masking + reveal rule, job transitions, conversation/acceptance enforcement shapes                                                                                                 |
| `backend/tests/integration/messaging.test.js`  | HTTP conversation create/duplicate/send/read, isolation 404s, hidden→revealed contact, admin read-only                                                                                                 |
| `backend/tests/integration/acceptance.test.js` | HTTP quotation accept + job creation + events, idempotency, double-accept 409, visibility, job transitions                                                                                             |
| `backend/tests/integration/socket.test.js`     | Socket.IO auth, room membership enforcement, live message delivery                                                                                                                                     |

## Commands

```bash
# Unit tests only (health test needs a reachable dev DB for the probe)
npm run test:unit --workspace=@troublefree/backend

# Full suite: prepare the isolated test DB first, then run
npm run db:test:prepare --workspace=@troublefree/backend
npm test --workspace=@troublefree/backend
```

Integration tests always target `DB_TEST_NAME` (`NODE_ENV=test`), never
the development database. They run serially (`--test-concurrency=1`)
because the migration suite rebuilds the shared test schema. Tests fail
loudly when MySQL is unreachable — they are never silently skipped.

## Frontend suites (Phase 3, Vitest + jsdom; Phase 4 traveller flow added)

| Location                                                                   | Scope                                                                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `web/packages/api-client/tests/auth.test.js`                               | Auth header, 401 → single-flight refresh → retry, no-loop session loss, error normalization                            |
| `web/apps/traveller/src/features/auth/__tests__/auth.test.jsx`             | Login/register pages, Google button, guards, logout, recovery                                                          |
| `web/apps/agency/src/features/auth/__tests__/auth.test.jsx`                | Agency login/register, no Google entry point, guards, logout                                                           |
| `web/apps/admin/src/features/auth/__tests__/auth.test.jsx`                 | Admin login only, no public registration, role protection                                                              |
| `web/apps/traveller/src/features/trip/__tests__/trip.test.jsx`             | Protected traveller routes, stop creation/ordering, calculation state, form validation, draft loading, submit workflow |
| `web/apps/agency/src/features/agency/__tests__/agency.test.jsx`            | Agency inbox list/detail, quotation form validation, item totals display, draft save, submit                           |
| `web/apps/traveller/src/features/quotations/__tests__/quotations.test.jsx` | Traveller quotation listing/detail, no acceptance UI                                                                   |
| `web/apps/traveller/src/features/messaging/__tests__/phase6.test.jsx`      | Traveller message list/thread/send, quotation accept + contact reveal, jobs                                            |
| `web/apps/agency/src/features/agency/__tests__/phase6.test.jsx`            | Agency message list/thread/send, jobs + status updates, dashboard counts                                               |

```bash
npm run test --workspace=@troublefree/api-client
npm run test --workspace=@troublefree/traveller-web   # vitest run
npm run test --workspace=@troublefree/agency-web
npm run test --workspace=@troublefree/admin-web
```

Google UI tests stub `window.google` (GIS); live Google is not
configured — see `docs/authentication.md`.

## CI

CI provisions a MySQL 8 service, creates both databases, runs
`db:test:prepare`, then `npm test`. See `.github/workflows/ci.yml`.
