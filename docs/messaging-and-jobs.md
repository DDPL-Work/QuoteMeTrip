# Messaging, Acceptance & Jobs

## Status

Implemented in **Phase 6** (messaging, contact reveal, quotation
acceptance, job foundation).

## Messaging

One conversation = one traveller + one agency + one travel request
(UNIQUE triple, no duplicates). Creation is request-bound: travellers
may message only agencies with a submitted+ quotation on their own
submitted+ request; agencies only travellers of matched requests.
Only the two participants (plus read-only admin) may access a thread;
cross-party lookups are `404` (no existence leak).

REST persists (`POST /conversations/:id/messages` validates non-empty,
≤5000 chars, active thread, authorized sender); Socket.IO delivers
(`conversation:message`, `conversation:read`, `conversation:updated`).
Socket connections verify the Bearer access token; rooms
(`conversation:<id>`) require a server-side membership check — no
arbitrary room joining, no socket send path. Read receipts:
`PATCH /conversations/:id/read` marks the other party's messages.

## Contact protection

Rule: `not accepted → hidden`, `accepted → visible`, evaluated from
state — revealed iff a live job (`accepted`/`in_progress`/`completed`)
exists for the request (a cancelled job hides contact again).
Enforced exclusively in serializers (`contact-visibility.js`):
pre-reveal payloads carry traveller `{firstName}` and agency
`{agencyName,city,country}` only; post-reveal they add email/phone/
names on both sides. Message bodies get conservative display-time
masking pre-reveal (emails, 7+ digit runs → `[hidden contact]`);
stored text is untouched. Limitation: determined users can obfuscate
contact in free text — masking is a safety net; field-level
serialization is the guarantee. No React-side hiding is trusted.

## Quotation acceptance

`POST /quotations/:id/accept` (traveller, own submitted quotation on
own `submitted` request) runs one transaction: quotation → `accepted`,
request → `accepted`, job created (`accepted`), rival submitted
quotations → `rejected` (drafts stay but can no longer be submitted —
quoting requires a shopping-state request), commit; then
`QUOTATION_ACCEPTED` + `JOB_CREATED` + `CONTACT_REVEALED` post-commit.
Idempotent re-accept returns current state (`200`); a second quotation
after acceptance is `409`. Any DB failure rolls back everything.

## Job lifecycle

```text
accepted ──▶ in_progress ──▶ completed
   │              │
   └──▶ cancelled ◀┘
```

`PATCH /jobs/:id/status` validates server-side (participants only;
admin read-only). Jobs expose full participant contact while live.

## Notifications

New post-commit events on the Phase 5 bus: `MESSAGE_RECEIVED`,
`QUOTATION_ACCEPTED`, `JOB_CREATED`, `CONTACT_REVEALED`. Delivery
failures never affect transactions.

## Frontend

Traveller (light-green + yellow theme, see `docs/theme.md` if present,
else `web/packages/ui/src/theme.*`): Messages, ConversationDetail
(live socket updates), JobList/JobDetail; quotation detail has
[Message Agency] + [Accept Quotation], then Accepted badge + contact +
job link. Agency: Messages, ConversationDetail, Jobs, JobDetail;
dashboard counts for conversations and jobs. All calls via
`@troublefree/api-client` (`createMessagingApi`, `createJobApi`,
`accept()`); enums from `@troublefree/types`; socket receive-only.
