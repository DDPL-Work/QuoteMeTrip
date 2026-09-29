# Phase 7 — Audit Logging Architecture

## 1. Audit Log Policy

All administrative actions mutating agency eligibility, document verification, membership status, payment confirmation, and commission records are recorded in the `audit_logs` database table inside the primary database transaction.

## 2. Schema

- `actor_user_id`: Administrator ID executing the action.
- `action`: Standardized action key (`agency.approved`, `agency.rejected`, `agency.suspended`, `agency.reactivated`, `document.verified`, `document.rejected`, `membership.created`, `membership.activated`, `membership.suspended`, `payment.confirmed`, `commission.updated`).
- `entity_type`: Target entity name (`agency`, `document`, `membership`, `commission`, `membership_plan`).
- `entity_id`: Primary key of target entity.
- `before_state`: JSON state snapshot prior to mutation.
- `after_state`: JSON state snapshot after mutation.
- `ip_address`: Request IP address.
- `created_at`: Event timestamp.

## 3. Security

Audit logs never store passwords, JWT secrets, refresh tokens, or sensitive credentials.
