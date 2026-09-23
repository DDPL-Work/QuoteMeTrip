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

No database, authentication, or business logic is implemented yet.

## Development

```bash
npm run dev --workspace=@troublefree/backend
```

Server runs on `http://localhost:5000` by default (see `.env.example`).

## Scripts

| Script         | Description                       |
| -------------- | --------------------------------- |
| `npm run dev`  | Start with nodemon (auto-restart) |
| `npm start`    | Start the server                  |
| `npm run lint` | Run ESLint                        |

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
