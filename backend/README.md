# @troublefree/backend

Express.js API for the Troublefree Holiday platform (modular monolith).

## Phase 1 scope

This package currently provides:

- Express app bootstrap (`src/app.js`) and server startup (`src/server.js`)
- Security headers (Helmet) and environment-driven CORS
- Versioned API mount at `/api/v1`
- `GET /api/v1/health` health check endpoint
- Structured JSON 404 and error handling
- Placeholder middleware and integration folders for future phases

No authentication or business logic is implemented yet.

## Development

```bash
npm run dev --workspace=@troublefree/backend
```

Server runs on `http://localhost:5000` by default (see `.env.example`).

MySQL 8 must be reachable (see `docs/database.md`). Prepare the schema
once per environment:

```bash
npm run db:migrate --workspace=@troublefree/backend
npm run db:seed --workspace=@troublefree/backend
```

## Scripts

| Script                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | Start with nodemon (auto-restart)                   |
| `npm start`               | Start the server                                    |
| `npm run lint`            | Run ESLint                                          |
| `npm test`                | Unit + integration tests (needs test DB, see below) |
| `npm run test:unit`       | Unit tests only                                     |
| `npm run db:migrate`      | Apply pending migrations                            |
| `npm run db:migrate:undo` | Revert migrations (`--steps=N`)                     |
| `npm run db:seed`         | Run seeders (idempotent)                            |
| `npm run db:seed:undo`    | Undo seeders                                        |
| `npm run db:test:prepare` | Migrate + seed the isolated test database           |

## Structure

```
src/
├── config/         # cors, and future non-secret config
├── middleware/      # cross-cutting request middleware
├── modules/         # business modules (Phase 2+)
├── integrations/    # third-party provider adapters (maps, weather, email, sms, firebase, payments, esignature, ai)
├── routes/           # route registration
├── utils/            # errors, response helpers
├── app.js
└── server.js
```
