# Database

## Status

Implemented in **Phase 2 — MySQL + Sequelize Database Foundation**.

## Stack

- **Database:** MySQL 8
- **ORM:** Sequelize 6 (`sequelize` + `mysql2` in `backend/package.json`)
- **Schema management:** versioned migrations in `backend/src/db/migrations/`,
  tracked in the `SequelizeMeta` table. `sequelize.sync()` is never used
  for schema management (no `alter`, never `force`).

## Prerequisites

MySQL 8 must be reachable. Local development uses Docker:

```bash
docker run -d --name tfh-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -p 3307:3306 \
  mysql:8.0
docker exec tfh-mysql mysql -uroot -proot \
  -e "CREATE DATABASE IF NOT EXISTS troublefree_holiday;
      CREATE DATABASE IF NOT EXISTS troublefree_holiday_test;"
```

## Environment variables

See `backend/.env.example`. Required database settings:

| Variable                       | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `DB_HOST`                      | MySQL host (`127.0.0.1`, not `localhost`)                    |
| `DB_PORT`                      | MySQL port (`3306` standard)                                 |
| `DB_NAME`                      | Development database                                         |
| `DB_USER` / `DB_PASSWORD`      | Credentials (never committed)                                |
| `DB_DIALECT`                   | `mysql`                                                      |
| `DB_POOL_MAX/MIN/ACQUIRE/IDLE` | Connection pool tuning                                       |
| `DB_CONNECT_TIMEOUT_MS`        | Fail-fast timeout for unreachable hosts                      |
| `DB_LOGGING`                   | `true` to print SQL (dev only)                               |
| `DB_REQUIRE_ON_BOOT`           | `true` = refuse to boot without a DB (default in production) |
| `DB_TEST_NAME`                 | Isolated test database (`NODE_ENV=test`)                     |

> `127.0.0.1` instead of `localhost`: on Windows `localhost` can
> resolve to `::1` while Docker's port proxy listens on IPv4,
> causing `ECONNREFUSED`.

`.env` files are git-ignored. Never commit credentials.

## Architecture

```
backend/src/
├── config/database.js   # env-driven config (dev vs test DB selection)
├── db/
│   ├── sequelize.js     # SINGLE Sequelize instance + connect/close
│   ├── models/          # User, TravellerProfile, AgencyProfile,
│   │                    # AgencyDocument, MembershipPlan, AgencyMembership,
│   │                    # AuthSession, AuthIdentity
│   │                    # + index.js (only place associations are defined)
│   ├── migrations/      # versioned up/down migrations
│   ├── seeders/         # idempotent development seed data
│   ├── runner.js        # migrateUp / migrateDown / runSeeds / undoSeeds
│   ├── transaction.js   # withTransaction() helper
│   └── health.js        # SELECT 1 probe with hard timeout
└── scripts in backend/scripts/ (db-migrate, db-seed, ...)
```

### Foreign-key behavior

- User → profiles: `CASCADE` (profiles are existence-dependent).
- AgencyProfile → documents/memberships: `CASCADE` (owned records).
- MembershipPlan → memberships: `RESTRICT` (preserve history; deactivate plans instead of deleting).
- AgencyDocument.verifiedBy → users: `SET NULL` (audit trail survives admin removal).
- User → AuthSession / AuthIdentity: `CASCADE` (sessions and provider
  links are meaningless without the user).
- User → Route / TravelRequest: `CASCADE` (traveller planning data
  dies with the user).
- Route → RouteStop: `CASCADE` (stops are existence-dependent).
- Route → TravelRequest: `RESTRICT` (a referenced route cannot be
  deleted silently).
- TravelRequest → TravelRequestDay: `CASCADE` (days die with the
  request).
- TravelRequest → TravelRequestAgency / Quotation: `CASCADE`
  (matches and quotations die with the request).
- AgencyProfile → TravelRequestAgency / Quotation: `CASCADE`
  (matches and quotations die with the agency).
- Quotation → QuotationItem: `CASCADE` (items are
  existence-dependent lines of their quotation).
- TravelRequest → Conversation / Job: `CASCADE` (threads and jobs die
  with the request).
- User → Conversation (traveller) / Job (traveller): `CASCADE`.
- AgencyProfile → Conversation / Job: `CASCADE`.
- Conversation → Message: `CASCADE` (lines die with the thread).
- Message.sender → User: `SET NULL` (threads stay readable).
- Quotation → Job: `RESTRICT` (accepted quotation survives the job).
- All foreign keys: `ON UPDATE CASCADE`.

## Phase 3 tables (authentication)

`auth_sessions` — one row per issued refresh token:

```text
id, user_id → users(CASCADE), token_hash CHAR(64) UNIQUE,
token_family CHAR(36), expires_at, revoked_at,
replaced_by_session_id → auth_sessions(SET NULL),
ip_address, user_agent, last_used_at, created_at, updated_at
```

Only the SHA-256 hash of the refresh JWT is stored — the raw token
exists solely in the HttpOnly cookie. Rotation links the old session
to its replacement inside a `token_family`, enabling reuse detection.
Indexes: `user_id`, unique `token_hash`, `token_family`, `expires_at`.
Stale sessions (expired, or revoked >30 days ago) are removed by
`npm run auth:cleanup --workspace=@troublefree/backend` (cron-safe,
no queue/Redis).

`auth_identities` — normalized social provider linkage:

```text
id, user_id → users(CASCADE), provider ('google' in Phase 3),
provider_user_id, provider_email,
UNIQUE(provider, provider_user_id)
```

`users` gained `last_login_at` (nullable). No other user columns were
added — email verification and password-change workflows are deferred
to their own phases. Token-storage principles and auth security:
`docs/security.md`.

## Phase 4 tables (traveller core)

`routes` — one traveller-owned route calculation:

```text
id, traveller_id → users(CASCADE), start_location, final_destination,
total_distance_km DECIMAL(10,2), estimated_duration_minutes,
recommended_days, calculation_provider ('haversine' default),
calculation_version ('v1'), raw_route_data JSON (provider response),
created_at, updated_at
```

Index: `traveller_id`. Deleting a user deletes their routes.

`route_stops` — ordered stops of a route:

```text
id, route_id → routes(CASCADE), sequence (0-based stop order),
stop_type ('start' | 'intermediate' | 'final'),
location_name, latitude DECIMAL(10,7), longitude DECIMAL(10,7),
place_id (opaque provider reference, nullable), created_at, updated_at
```

Indexes: `route_id`, UNIQUE(`route_id`, `sequence`) — the stop order
is explicit and enforced by the database.

`travel_requests` — draft-first traveller workflow:

```text
id, traveller_id → users(CASCADE), route_id → routes(RESTRICT),
status ENUM(draft, submitted, matching, quoted, accepted, cancelled,
  completed; default draft),
travel_start_date, travel_end_date, number_of_travellers (default 1),
luggage_count (default 0),
accommodation_type ENUM(3_star, 4_star, 5_star, s_class, nullable),
hotel_required, guide_required, driver_required (booleans),
package_type ENUM(hotel_only, vehicle_driver, full_package, nullable),
special_requests TEXT, submitted_at, created_at, updated_at
```

`route_id` uses `RESTRICT`: a route referenced by a request cannot be
deleted silently — the request must be removed first. Indexes:
`traveller_id`, `route_id`, `status`.

`travel_request_days` — day-by-day plan rows:

```text
id, travel_request_id → travel_requests(CASCADE), day_number (1-based),
date, location, title, description, hotel_notes, guide_notes,
driver_notes, special_requirements, created_at, updated_at
```

Indexes: `travel_request_id`,
UNIQUE(`travel_request_id`, `day_number`) — day numbers are unique per
request. Request lifecycle and transitions:
`docs/travel-request-workflow.md`.

## Phase 5 tables (agency matching & quotations)

`travel_request_agencies` — one matched agency/request pair:

```text
id, travel_request_id → travel_requests(CASCADE),
agency_id → agency_profiles(CASCADE),
match_status ENUM(matched, viewed, quoted, declined, expired,
  withdrawn; default matched),
matched_at, viewed_at, responded_at, created_at, updated_at
```

Indexes: `travel_request_id`, `agency_id`, `match_status`,
UNIQUE(`travel_request_id`, `agency_id`) — duplicate matches are
rejected by the database. Matching rules and inbox:
`docs/agency-matching-and-quotations.md`.

`quotations` — agency quotation for a matched request:

```text
id, travel_request_id → travel_requests(CASCADE),
agency_id → agency_profiles(CASCADE),
status ENUM(draft, submitted, withdrawn, expired, accepted, rejected;
  default draft),
quotation_type ENUM(hotel_only, vehicle_driver, full_package),
currency CHAR(3) (default USD), subtotal DECIMAL(12,2),
total_amount DECIMAL(12,2) (both server-calculated),
valid_until, notes, submitted_at, created_at, updated_at
```

`accepted`/`rejected`/`expired` exist for later phases; Phase 5
transitions are `draft → submitted`, `draft → withdrawn`,
`submitted → withdrawn` only. Indexes: `travel_request_id`,
`agency_id`, `status`. One active (`draft`/`submitted`) quotation per
agency/request is enforced in service logic (409 otherwise).

`quotation_items` — structured quotation lines:

```text
id, quotation_id → quotations(CASCADE),
item_type ENUM(hotel, vehicle, driver, guide, service, other),
title, description, quantity DECIMAL(10,2), unit_price DECIMAL(12,2),
total_price DECIMAL(12,2) (quantity × unit_price, server-side),
metadata JSON, created_at, updated_at
```

Indexes: `quotation_id`, `item_type`.

## Phase 6 tables (messaging, acceptance & jobs)

`conversations` — one traveller/agency thread per travel request:

```text
id, travel_request_id → travel_requests(CASCADE),
traveller_id → users(CASCADE), agency_id → agency_profiles(CASCADE),
status ENUM(active, closed; default active), created_at, updated_at
```

Indexes: `travel_request_id`, `traveller_id`, `agency_id`, `status`,
UNIQUE(`travel_request_id`, `traveller_id`, `agency_id`) — no
duplicate active conversations per triple.

`messages` — conversation lines:

```text
id, conversation_id → conversations(CASCADE),
sender_user_id → users(SET NULL, nullable for system messages),
message_type ENUM(text, system; default text), body TEXT,
metadata JSON, read_at, created_at, updated_at
```

Indexes: `conversation_id`, `sender_user_id`,
(`conversation_id`, `created_at`).

`jobs` — accepted-quotation work tracking:

```text
id, travel_request_id → travel_requests(CASCADE),
quotation_id → quotations(RESTRICT), traveller_id → users(CASCADE),
agency_id → agency_profiles(CASCADE),
status ENUM(accepted, in_progress, completed, cancelled),
accepted_at, started_at, completed_at, cancelled_at,
created_at, updated_at
```

`RESTRICT` on `quotation_id`: the accepted quotation cannot disappear
under a live job. Indexes: `travel_request_id`, `quotation_id`,
`traveller_id`, `agency_id`, `status`. Lifecycle:
`docs/messaging-and-jobs.md`.

## Commands

Run from the repository root with `--workspace=@troublefree/backend`:

```bash
npm run db:migrate --workspace=@troublefree/backend        # apply pending migrations
npm run db:migrate:undo --workspace=@troublefree/backend  # revert last migration (--steps=N)
npm run db:seed --workspace=@troublefree/backend          # run seeders (idempotent)
npm run db:seed:undo --workspace=@troublefree/backend     # undo seeders
npm run db:test:prepare --workspace=@troublefree/backend  # migrate + seed the TEST database
npm test --workspace=@troublefree/backend                 # unit + integration tests
npm run test:unit --workspace=@troublefree/backend        # unit tests only
```

## Test database

`NODE_ENV=test` resolves every connection to `DB_TEST_NAME`
(`troublefree_holiday_test`), so destructive tests can never touch the
development database. Prepare it with `db:test:prepare` before running
tests. Integration tests fail loudly when MySQL is unreachable — they
are never silently skipped.

## Health check

`GET /api/v1/health` keeps the Phase 1 contract and adds a `database`
probe (`connected` / `unavailable` with latency). Top-level `status`
is `healthy` when the database is reachable, `degraded` otherwise
(HTTP 200 in both cases — the app itself is up).

## Startup / shutdown

Boot order: load config → init models/associations → verify DB
connectivity → start HTTP. Without a database, production
(`NODE_ENV=production` or `DB_REQUIRE_ON_BOOT=true`) exits non-zero;
development boots degraded and reports via `/health`.

Shutdown (`SIGINT`/`SIGTERM`): stop accepting requests → close HTTP
server → close the Sequelize pool → exit. No open connections remain.
