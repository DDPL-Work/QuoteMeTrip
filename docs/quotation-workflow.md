# Quotation Workflow

## Status

Implemented in **Phase 5** (draft → submit), extended in **Phase 6**
(submit → accept + jobs).

## Overview

```text
Agency Quotation → Messaging → Quotation Acceptance → Job
```

## Lifecycle

```text
draft ──submit──▶ submitted ──accept──▶ accepted
  │                  │                      │
  └──withdraw──▶ withdrawn                 job created
  (submitted ──withdraw──▶ withdrawn)      rivals → rejected
```

Phase 5: `draft → submitted`, `draft → withdrawn`,
`submitted → withdrawn` (agency-driven). Phase 6 adds traveller
`submitted → accepted` via `POST /quotations/:id/accept` — one
transaction (quotation + request accepted, job created, rivals
rejected), idempotent re-accept, `409` on a second quotation.
`expired`/`rejected` exist for automation/declines; no other
transitions are wired.

## Negotiation

Quotations are single-shot in Phase 6: drafts are editable, submitted
quotations are not (withdraw and re-quote instead). Traveller ↔ agency
negotiation happens via conversations (see
`docs/messaging-and-jobs.md`), not via quotation versioning.

## Acceptance rules

- Traveller owns the request; quotation is `submitted` and belongs to
  the request; request is `submitted` (shopping still open).
- One acceptance per request: afterwards the request is `accepted`,
  rival submitted quotations are `rejected`, and new submits/creates
  are refused (quoting requires a shopping-state request).
- Acceptance reveals contact (live-job rule) and emits
  `QUOTATION_ACCEPTED`, `JOB_CREATED`, `CONTACT_REVEALED`.

## Jobs

Born `accepted` at acceptance; `accepted → in_progress → completed`,
`accepted|in_progress → cancelled`. Participant-driven, admin
read-only. Full lifecycle: `docs/messaging-and-jobs.md`.
