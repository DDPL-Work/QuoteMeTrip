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
│   │                    # AgencyDocument, MembershipPlan, AgencyMembership
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
- All foreign keys: `ON UPDATE CASCADE`.

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
