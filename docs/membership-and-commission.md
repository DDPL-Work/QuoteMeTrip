# Phase 7 — Membership Lifecycle & Commission Management

## 1. Membership Plans & Subscriptions

Membership plans define subscription tiers (`Monthly`, `3-Month`, `6-Month`, `Annual`).

### Manual Payment Confirmation Flow

1. Agency requests or is assigned a membership (`status = 'pending'`).
2. Administrator verifies manual payment out-of-band (e.g. bank wire transfer).
3. Administrator executes payment confirmation via `POST /api/v1/admin/memberships/:id/confirm-payment`.
4. System sets `status = 'active'`, `confirmedBy = adminUserId`, `confirmedAt = now`, logs audit action, and emits `PAYMENT_CONFIRMED` and `MEMBERSHIP_ACTIVATED` events.

---

## 2. Commission System

Commissions are calculated automatically upon quotation acceptance when a marketplace `Job` is created.

### Calculation Rule

`commissionAmount = (jobAmount * commissionRate) / 100` (rounded to 2 decimal places).
Default rate is `10.00%`.

### Commission Endpoints

- `GET /api/v1/admin/commissions`: Filterable list of commissions.
- `GET /api/v1/admin/commissions/summary`: Aggregated financial summary.
- `PATCH /api/v1/admin/commissions/:id/status`: Update status (`pending`, `confirmed`, `paid`, `cancelled`).
