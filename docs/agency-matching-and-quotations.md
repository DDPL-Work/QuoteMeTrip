# Agency Matching & Quotations

## Status

Implemented in **Phase 5** (matching, inbox, quotation draft → submit only).

## Overview

```text
Traveller submits request
  → match eligible agencies (travel_request_agencies)
  → agency inbox → request detail → quotation draft → edit → submit
  → traveller compares submitted quotations (no acceptance yet)
```

## Matching flow

`submitRequest()` (Phase 4, extended) runs in one transaction:

1. Validate request state (`draft`, dates present).
2. Flip status to `submitted` + `submittedAt`.
3. `matchAgenciesForRequest()` finds eligible agencies and inserts
   `travel_request_agencies` rows (`matched`), skipping pairs that
   already exist (idempotent; UNIQUE constraint as backstop).
4. Commit; then emit one `REQUEST_MATCHED` event per new match.
   Event delivery failures are logged/swallowed and can never roll
   back the submission.

No advanced recommendation algorithm: `isAgencyEligibleForRequest()`
in `matching.service.js` is the documented extension point for future
geographic/route-based rules (currently matches every eligible agency).

## Matching eligibility

An agency receives new matches only when ALL hold:

- `agency_profiles.status = 'approved'` — the Phase 2 schema has no
  `active` profile value; `approved` is the documented
  active-equivalent (pending/rejected/suspended excluded).
- `users.status = 'active'` AND `users.role = 'agency'`.
- At least one `agency_memberships` row with `status = 'active'`,
  `startsAt <= now`, and (`endsAt IS NULL` OR `endsAt > now`).

Request side: only `submitted` (or later matched states) can be
matched. Re-submitting never duplicates rows.

## Agency inbox

`GET /api/v1/agency/travel-requests` (agency role only):

- Only requests the agency is matched to (join on
  `travel_request_agencies`); unmatched IDs are `404`.
- Default match filter `matched,viewed,quoted`; optional
  `matchStatus`, request `status`, `from`/`to` (travel start date),
  `destination` (substring over start/final/stops/day locations).
- Pagination: `?page=&pageSize=` (defaults 1/20, max 100) →
  `{ data: { requests }, pagination: { page, pageSize, totalItems,
totalPages } }`. This is the project's pagination convention.
- `GET /:id` detail + `POST /:id/view` (`matched → viewed`).

## Quotation lifecycle

```text
draft ──submit──▶ submitted
  │                  │
  └──withdraw──▶ withdrawn ◀──withdraw──┘
```

`accepted`/`rejected`/`expired` exist in the ENUM for later phases;
`submitted → accepted` is NOT implemented. Only `draft` is editable;
`withdrawn` is terminal in Phase 5. One active (`draft`/`submitted`)
quotation per agency/request (`409` on duplicates).

## Quotation structures

```text
quotation: { id, travelRequestId, agencyId, status, quotationType,
  currency, subtotal, totalAmount, validUntil, notes, submittedAt,
  items[], agency? }
item: { id, itemType, title, description, quantity, unitPrice,
  totalPrice, metadata? }
```

Types: `hotel_only | vehicle_driver | full_package`;
items: `hotel | vehicle | driver | guide | service | other`.
Totals are server-calculated (`totalPrice = quantity × unit_price`,
`subtotal = Σ lines`, `total = subtotal` — no taxes/discounts defined,
none invented). Client-sent totals are rejected (`400`).

## Authorization

- Traveller: own requests, own (submitted) quotations only.
- Agency: matched requests, own quotations only; suspended or
  unapproved agencies cannot quote (`403`).
- Cross-owner lookups are `404` (no existence leak), consistent with
  the Phase 4 ownership policy.

## Contact protection

Pre-acceptance serializers expose minimum data:

- Agency sees traveller `{ firstName }` only.
- Traveller sees agency `{ agencyName, city, country }` only.
- No email/phone/WhatsApp anywhere in request or quotation payloads.
  No message-based filtering yet (later phase).

## Notifications

`src/modules/notifications/notification-events.js`: in-process event
bus + structured log. Events: `REQUEST_MATCHED`, `QUOTATION_SUBMITTED`
(emitted post-commit). No SMS/email/Firebase delivery in Phase 5;
delivery failures never corrupt transactions.

## Frontend flows

Agency: `/` dashboard → `/requests` inbox → `/requests/:id` detail →
`/requests/:id/quotations/new` → `/quotations` → `/quotations/:id`
→ `/quotations/:id/edit` (submit/withdraw only, no acceptance).
Traveller: request detail gains a quotations section (submitted only,
comparison table) + `/quotations/:id` detail. All calls go through
`@troublefree/api-client` (`createAgencyRequestApi`,
`createAgencyQuotationApi`, `createTravellerQuotationApi`); enums from
`@troublefree/types`.
