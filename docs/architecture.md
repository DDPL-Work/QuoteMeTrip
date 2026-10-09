# Architecture

## Overview

QuoteMeTrip is a modular monolithic backend serving three
independent React web applications (Traveller, Agency, Admin), built
as an npm-workspaces monorepo.

```text
React applications (Traveller / Agency / Admin)
       ↓
Express API (/api/v1)
       ↓
Modular backend (single deployable service)
       ↓
MySQL (Phase 2+)
```

## Applications

- **Traveller web** — `web/apps/traveller`
- **Agency web** — `web/apps/agency`
- **Admin web** — `web/apps/admin`

Each application is independently runnable, independently deployable,
and shares common code only through the packages under
`web/packages/*`. No application imports another application's source
directly.

## Backend

- Node.js + Express.js, ES Modules
- Modular monolith: business domains (traveller, agency, quotation,
  messaging, etc.) will live as self-contained folders under
  `backend/src/modules/`, not as separately deployed services
- Third-party providers (maps, weather, email, sms, firebase,
  payments, esignature, ai) are isolated behind adapters under
  `backend/src/integrations/`
- API is versioned at `/api/v1`

## Database

MySQL via Sequelize, introduced in Phase 2. No database logic exists
in Phase 1.

## Integrations

See `docs/integrations.md`.

## Deployment

See `docs/deployment.md`.
