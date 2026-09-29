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

## Phase 4 scope (traveller core)

- Traveller profile: `GET`/`PATCH /api/v1/travellers/me`
  (`src/modules/traveller/`, Phase 2 `traveller_profiles` table).
- Route planning: `POST /api/v1/routes/calculate` (no persistence) +
  `POST`/`GET`/`PATCH`/`DELETE /api/v1/routes`
  (`src/modules/routes/`). Calculation goes through the
  `MapProvider` abstraction (`src/integrations/maps/`, default
  `haversine` — no credentials); recommended days live in
  `recommended-days.service.js` (v1 formula, traveller-overridable).
- Travel requests: `POST`/`GET`/`PATCH /api/v1/travel-requests`,
  `POST /:id/submit`, `POST /:id/cancel`, day CRUD
  (`src/modules/travel-requests/`). Creation is transactional
  (`withTransaction()`); lifecycle is `draft → submitted` (cancel
  from `draft`/`submitted`).
- Weather boundary (`src/integrations/weather/`): graceful
  `{ available: false }` degradation, never required for requests.

Environment: `MAP_PROVIDER` (`haversine` default, no credentials),
`MAP_OSRM_BASE_URL` (only for `osrm`), `WEATHER_API_KEY` (optional;
empty = weather unavailable). See `.env.example` and
`docs/travel-request-workflow.md`.

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
├── config/         # cors, auth, database (env-driven, no secrets)
├── middleware/      # authenticate, authorize, rateLimiter, errorHandler, ...
├── modules/         # auth (Phase 3), traveller, routes, travel-requests (Phase 4)
├── integrations/    # maps (provider abstraction + recommended days), weather (graceful boundary), email, sms, firebase, payments, esignature, ai
├── routes/           # versioned route registration (/api/v1)
├── utils/            # errors (App/Auth/Validation/NotFound/Forbidden), response helpers, jwt, tokens
├── app.js
└── server.js
```
