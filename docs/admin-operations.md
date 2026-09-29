# Phase 7 — Admin Operations, Agency Approval & Operational Management

## 1. Overview

The Admin Operations subsystem provides backend APIs and an operational web application (`web/apps/admin`) for platform administrators to manage the agency marketplace lifecycle, verify business documents, handle manual membership payments, track platform commission fees, and audit sensitive actions.

---

## 2. Agency Lifecycle & Approval Rules

Agencies onboard in a `pending` status. New Traveller travel requests are only matched to agencies that satisfy:

1. `AgencyProfile.status = 'approved'`
2. `User.status = 'active'` with `role = 'agency'`
3. `AgencyMembership.status = 'active'` with current date within `startsAt` and `endsAt`.

### State Transitions

- `pending` → `approved` (Admin Approval)
- `pending` → `rejected` (Admin Rejection)
- `approved` → `suspended` (Admin Suspension)
- `suspended` → `approved` (Admin Reactivation)

---

## 3. Endpoints

### Agency Management

- `GET /api/v1/admin/agencies`: List agencies with search, status filtering, and pagination.
- `GET /api/v1/admin/agencies/:id`: Detailed profile view including documents and memberships.
- `POST /api/v1/admin/agencies/:id/approve`: Approve agency.
- `POST /api/v1/admin/agencies/:id/reject`: Reject agency.
- `POST /api/v1/admin/agencies/:id/suspend`: Suspend agency.
- `POST /api/v1/admin/agencies/:id/reactivate`: Reactivate agency.
- `POST /api/v1/admin/agencies/:id/documents/:documentId/verify`: Approve verification document.
- `POST /api/v1/admin/agencies/:id/documents/:documentId/reject`: Reject document with reason.

### Operational Visibility & Dashboard

- `GET /api/v1/admin/dashboard`: Real-time operational metrics.
- `GET /api/v1/admin/travel-requests`: Read-only travel requests list.
- `GET /api/v1/admin/jobs`: Read-only jobs list.
