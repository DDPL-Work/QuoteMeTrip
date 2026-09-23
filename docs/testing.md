# Testing

Test runner: Node's built-in test runner (`node --test`).

## Suites

| Location                                       | Scope                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `backend/tests/unit/health.test.js`            | Health endpoint contract (incl. DB probe)                               |
| `backend/tests/unit/models.test.js`            | Model attributes, constraints, associations (no DB)                     |
| `backend/tests/integration/database.test.js`   | CRUD, uniqueness, FK integrity, CASCADE/RESTRICT/SET NULL, transactions |
| `backend/tests/integration/migrations.test.js` | Fresh migrate up → down → up round-trip                                 |
| `backend/tests/integration/seeders.test.js`    | Seed idempotency, undo, re-seed                                         |

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

## CI

CI provisions a MySQL 8 service, creates both databases, runs
`db:test:prepare`, then `npm test`. See `.github/workflows/ci.yml`.
