# Complete API Documentation

> **Base URL**: `/api/v1`  
> **Documentation File**: [docs/api.md](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/docs/api.md)

This document lists all RESTful API endpoints developed across Phases 1–8 of the **QuoteMeTrip** platform.

---

## Response & Error Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Authentication & Authorization

Protected endpoints require the `Authorization` header with a Bearer access token:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Roles: `traveller`, `agency`, `admin`.

---

## Complete API Registry

### 1. Health & System Probes (`/health`)

- `GET /api/v1/health` — Service & database health check.
- `GET /api/v1/health/liveness` — Process liveness probe.
- `GET /api/v1/health/readiness` — Service readiness probe (database & integration credentials).

### 2. Authentication & Identity (`/auth`)

- `POST /api/v1/auth/register/traveller` — Traveller account registration.
- `POST /api/v1/auth/register/agency` — Travel agency registration (requires admin approval).
- `POST /api/v1/auth/login` — Account login (email & password).
- `POST /api/v1/auth/google` — Traveller Google OAuth login.
- `POST /api/v1/auth/refresh` — Refresh access token (HttpOnly cookie).
- `POST /api/v1/auth/logout` — Revoke current session.
- `POST /api/v1/auth/logout-all` — Revoke all sessions for current user (Authenticated).
- `GET /api/v1/auth/me` — Current authenticated user identity & profile (Authenticated).

### 3. Traveller Profile (`/travellers`)

- `GET /api/v1/travellers/me` — Retrieve traveller profile (Traveller).
- `PATCH /api/v1/travellers/me` — Update traveller profile details (Traveller).

### 4. Route Planning (`/routes`)

- `POST /api/v1/routes/calculate` — Calculate route geometry, distance & duration without saving (Traveller).
- `POST /api/v1/routes` — Calculate and save route (Traveller).
- `GET /api/v1/routes/:id` — Retrieve own saved route (Traveller).
- `PATCH /api/v1/routes/:id` — Update own saved route (Traveller).
- `DELETE /api/v1/routes/:id` — Delete own route (Traveller).

### 5. Travel Requests (`/travel-requests`)

- `POST /api/v1/travel-requests` — Create draft travel request (Traveller).
- `GET /api/v1/travel-requests` — List traveller's travel requests (Traveller).
- `GET /api/v1/travel-requests/:id` — Retrieve request details (Traveller).
- `PATCH /api/v1/travel-requests/:id` — Update draft request (Traveller).
- `POST /api/v1/travel-requests/:id/submit` — Submit request (`draft` -> `submitted`) (Traveller).
- `POST /api/v1/travel-requests/:id/cancel` — Cancel request (Traveller).
- `POST /api/v1/travel-requests/:id/days` — Add day to draft request itinerary (Traveller).
- `PATCH /api/v1/travel-requests/:id/days/:dayId` — Update day in draft request (Traveller).
- `DELETE /api/v1/travel-requests/:id/days/:dayId` — Remove day from draft request (Traveller).

### 6. Agency Lead Inbox (`/agency/travel-requests`)

- `GET /api/v1/agency/travel-requests` — Paginated matched request inbox (Agency).
- `GET /api/v1/agency/travel-requests/:id` — Matched request details with protected contacts (Agency).
- `POST /api/v1/agency/travel-requests/:id/view` — Mark request as viewed (Agency).

### 7. Quotations (`/agency/quotations` & `/travel-requests/:id/quotations`)

- `POST /api/v1/agency/travel-requests/:id/quotations` — Create draft quotation (Agency).
- `GET /api/v1/agency/quotations` — List agency's own quotations (Agency).
- `GET /api/v1/agency/quotations/:id` — Get agency quotation detail (Agency).
- `PATCH /api/v1/agency/quotations/:id` — Edit draft quotation (Agency).
- `POST /api/v1/agency/quotations/:id/submit` — Submit quotation (`draft` -> `submitted`) (Agency).
- `POST /api/v1/agency/quotations/:id/withdraw` — Withdraw quotation (Agency).
- `GET /api/v1/travel-requests/:id/quotations` — List submitted quotations for request (Traveller).
- `GET /api/v1/quotations/:id` — Get quotation detail (Traveller).

### 8. Quotation Acceptance (`/quotations/:id/accept`)

- `POST /api/v1/quotations/:id/accept` — Accept quotation, create Job & reveal contact info (Traveller).

### 9. Jobs & Booking Execution (`/jobs`)

- `GET /api/v1/jobs` — List jobs (Traveller/Agency/Admin).
- `GET /api/v1/jobs/:id` — Get job details (Participants/Admin).
- `PATCH /api/v1/jobs/:id/status` — Update job status (`accepted` -> `in_progress` -> `completed` | `cancelled`).

### 10. Realtime Messaging (`/conversations`)

- `GET /api/v1/conversations` — List active conversation threads (Traveller/Agency/Admin).
- `POST /api/v1/conversations` — Open or get request conversation thread (Traveller/Agency).
- `GET /api/v1/conversations/:id` — Get thread details (Traveller/Agency/Admin).
- `GET /api/v1/conversations/:id/messages` — Get thread message history (Traveller/Agency/Admin).
- `POST /api/v1/conversations/:id/messages` — Send message in thread (Participants).
- `PATCH /api/v1/conversations/:id/read` — Mark thread messages as read (Participants).

### 11. Push Notifications (`/notifications`)

- `GET /api/v1/notifications` — Get user notifications (Authenticated).
- `GET /api/v1/notifications/unread-count` — Get unread count (Authenticated).
- `PATCH /api/v1/notifications/:id/read` — Mark notification read (Authenticated).
- `PATCH /api/v1/notifications/read-all` — Mark all notifications read (Authenticated).
- `POST /api/v1/notifications/push-token` — Register push token (Authenticated).

### 12. Destination Weather (`/weather`)

- `GET /api/v1/weather` — Weather forecast for location and date (Public).

### 13. Public Travel Guide (`/travel-guide`)

- `GET /api/v1/travel-guide/regions` — List active regions (Public).
- `GET /api/v1/travel-guide/destinations` — List active destinations (Public).
- `GET /api/v1/travel-guide/destinations/:slug` — Get destination by slug (Public).
- `GET /api/v1/travel-guide/articles` — List published articles (Public).
- `GET /api/v1/travel-guide/articles/:slug` — Get article by slug (Public).

### 14. Customer Ratings & Reviews (`/jobs` & `/agencies`)

- `POST /api/v1/jobs/:jobId/rating` — Submit 1-5 star job rating (Traveller).
- `GET /api/v1/jobs/:jobId/rating` — Get rating for job (Authenticated).
- `GET /api/v1/agencies/:id/rating-summary` — Aggregate rating summary for agency (Public).

### 15. Admin — Agency Verification & Management (`/admin/agencies`)

- `GET /api/v1/admin/agencies` — List registered agencies & statuses (Admin).
- `GET /api/v1/admin/agencies/:id` — Agency profile & compliance documents (Admin).
- `POST /api/v1/admin/agencies/:id/approve` — Approve agency registration (Admin).
- `POST /api/v1/admin/agencies/:id/reject` — Reject agency registration (Admin).
- `POST /api/v1/admin/agencies/:id/suspend` — Suspend agency account (Admin).
- `POST /api/v1/admin/agencies/:id/reactivate` — Reactivate suspended agency (Admin).
- `POST /api/v1/admin/agencies/:id/documents/:documentId/verify` — Verify agency document (Admin).
- `POST /api/v1/admin/agencies/:id/documents/:documentId/reject` — Reject agency document (Admin).

### 16. Admin — Memberships & Subscriptions (`/admin`)

- `GET /api/v1/admin/membership-plans` — List membership plans (Admin).
- `POST /api/v1/admin/membership-plans` — Create membership plan (Admin).
- `PATCH /api/v1/admin/membership-plans/:id` — Update membership plan (Admin).
- `GET /api/v1/admin/memberships` — List agency memberships (Admin).
- `GET /api/v1/admin/memberships/:id` — Get membership subscription details (Admin).
- `POST /api/v1/admin/memberships/:id/confirm-payment` — Confirm offline payment (Admin).
- `POST /api/v1/admin/memberships/:id/suspend` — Suspend agency membership (Admin).
- `POST /api/v1/admin/memberships/:id/reactivate` — Reactivate agency membership (Admin).
- `PATCH /api/v1/admin/memberships/:id` — Update membership details (Admin).
- `POST /api/v1/admin/agencies/:agencyId/membership` — Assign membership to agency (Admin).

### 17. Admin — Commissions & Financials (`/admin/commissions`)

- `GET /api/v1/admin/commissions` — List commission records (Admin).
- `GET /api/v1/admin/commissions/summary` — Financial commission summary (Admin).
- `GET /api/v1/admin/commissions/:id` — Commission detail (Admin).
- `PATCH /api/v1/admin/commissions/:id/status` — Update commission payment status (Admin).

### 18. Admin — Dashboard Operations & Visibility (`/admin`)

- `GET /api/v1/admin/dashboard` — Operational dashboard metrics (Admin).
- `GET /api/v1/admin/metrics` — Dashboard metrics alias (Admin).
- `GET /api/v1/admin/travel-requests` — All platform travel requests (Admin).
- `GET /api/v1/admin/travel-requests/:id` — View specific platform request detail (Admin).
- `GET /api/v1/admin/jobs` — All platform jobs (Admin).
- `GET /api/v1/admin/jobs/:id` — View specific platform job detail (Admin).

### 19. Admin — Audit Logs (`/admin/audit-logs`)

- `GET /api/v1/admin/audit-logs` — System audit logs and event history (Admin).

### 20. Admin — Travel Guide CMS (`/admin/travel-guide`)

- `GET /api/v1/admin/travel-guide/regions` — Manage travel regions (Admin).
- `POST /api/v1/admin/travel-guide/regions` — Create travel region (Admin).
- `PATCH /api/v1/admin/travel-guide/regions/:id` — Edit region (Admin).
- `DELETE /api/v1/admin/travel-guide/regions/:id` — Delete region (Admin).
- `GET /api/v1/admin/travel-guide/destinations` — Manage destinations (Admin).
- `POST /api/v1/admin/travel-guide/destinations` — Create destination (Admin).
- `PATCH /api/v1/admin/travel-guide/destinations/:id` — Edit destination (Admin).
- `DELETE /api/v1/admin/travel-guide/destinations/:id` — Delete destination (Admin).
- `GET /api/v1/admin/travel-guide/articles` — Manage articles (Admin).
- `POST /api/v1/admin/travel-guide/articles` — Create article (Admin).
- `GET /api/v1/admin/travel-guide/articles/:id` — Get article detail (Admin).
- `PATCH /api/v1/admin/travel-guide/articles/:id` — Edit article (Admin).
- `POST /api/v1/admin/travel-guide/articles/:id/publish` — Publish article (Admin).
- `POST /api/v1/admin/travel-guide/articles/:id/unpublish` — Unpublish article (Admin).
- `DELETE /api/v1/admin/travel-guide/articles/:id` — Delete article (Admin).

### 21. Admin — Ratings & Feedback (`/admin/ratings`)

- `GET /api/v1/admin/ratings` — List all customer job ratings (Admin).
- `GET /api/v1/admin/ratings/summary` — Global system rating summary (Admin).
