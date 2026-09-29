# Travel Request Workflow

## Status

Implemented in **Phase 4 — Traveller Core** (draft → submit only).

## Overview

```text
Traveller Profile → Route Selection → Route Calculation → Travel Request
  → Day-by-Day Requirements → Draft → Submit
```

The route is selected BEFORE the detailed travel request: a request
always references an existing traveller-owned route (`routeId`) or
carries an inline route that is calculated and persisted atomically
with the request.

## Request lifecycle

```text
draft ──submit──▶ submitted
  │                  │
  │                  │ (Phase 5+: matching, quotation, acceptance)
  └────cancel──▶ cancelled ◀──cancel──┘
```

Phase 4 transitions (enforced backend-side via
`TRAVEL_REQUEST_TRANSITIONS`):

| From        | To          | Endpoint                           |
| ----------- | ----------- | ---------------------------------- |
| `draft`     | `submitted` | `POST /travel-requests/:id/submit` |
| `draft`     | `cancelled` | `POST /travel-requests/:id/cancel` |
| `submitted` | `cancelled` | `POST /travel-requests/:id/cancel` |

All other transitions return `400
TRAVEL_REQUEST_INVALID_TRANSITION`. The `matching`, `quoted`,
`accepted`, and `completed` statuses exist in the ENUM for later
phases but have no transitions wired in Phase 4. Only `draft`
requests can be edited (`400 TRAVEL_REQUEST_NOT_EDITABLE`
otherwise). Submission requires travel dates.

## Creation transaction

`POST /travel-requests` runs inside `withTransaction()` covering
route creation + route stops + travel request + days: everything
commits together or everything rolls back — never partial data.

## Recommended days (initial suggestion, traveller-overridable)

Lives in `backend/src/integrations/maps/recommended-days.service.js`
(`calculationVersion: 'v1'`), never in the controller:

```text
distanceDays = ceil(distanceKm / 300)
stopDays     = ceil(intermediateStops / 2)
recommended  = clamp(distanceDays + stopDays, 1, 30)
```

Any valid route recommends at least 1 day. The Traveller may override
the value when saving the route or creating the request.

## Route calculation

`POST /routes/calculate` validates stops (minimum start + final,
explicit order, coordinates in range), calls the map provider through
the `MapProvider` abstraction (`backend/src/integrations/maps/`), and
returns distance, duration, geometry, and recommended days without
persisting. Default provider `haversine` needs no credentials; set
`MAP_PROVIDER=osrm` + `MAP_OSRM_BASE_URL` for road routing. Unknown
providers return a clear `503 MAP_PROVIDER_NOT_CONFIGURED` at call
time without affecting other modules.

## Weather boundary

`backend/src/integrations/weather/` exposes a minimal
`getWeatherForRoute()` that degrades to `{ available: false }` when
unconfigured or failing. Request creation never depends on weather.

## Frontend flow

`/plan-trip`: start → intermediate(s) → final → reorder → calculate →
distance/time/recommended days → day override → continue to request.
`/travel-requests`: list. `/travel-requests/:id`: draft editing,
day-by-day planner, submit/cancel. `/profile`: traveller profile
(auto-attached to requests, never re-typed).
