# API Documentation

## Overview & Base URL

All API endpoints are versioned and mounted under the `/api/v1` base URL.

```text
Base URL: /api/v1
```

---

## Standard Response & Error Format

All API endpoints return standard JSON responses with HTTP status codes indicating success or failure.

### Success Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

_(Note: Certain legacy/paginated endpoints return direct root object shapes such as `{ requests, pagination }` or `{ status: "success", data: ... }`)._

### Error Response Format

All errors return structured JSON, never raw HTML tracebacks:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": null
  }
}
```

### Common HTTP Status Codes

- `200 OK` — Request completed successfully.
- `201 Created` — Resource successfully created.
- `400 Bad Request` — Validation failure or invalid state transition.
- `401 Unauthorized` — Unauthenticated or invalid/expired session token.
- `403 Forbidden` — Authenticated user lacks required role or permissions.
- `404 Not Found` — Resource does not exist or user lacks ownership.
- `409 Conflict` — State conflict (e.g., duplicate quotation or active state violation).
- `500 Internal Server Error` — Server error.
- `503 Service Unavailable` — Missing external dependency or DB connection failure.

---

## Role-Based Access Control (RBAC)

Requests requiring authentication must supply a JSON Web Token (JWT) in the HTTP `Authorization` header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

User roles in the system:

- **`traveller`**: Regular customer booking travel itineraries.
- **`agency`**: Verified travel service provider receiving leads & creating quotations.
- **`admin`**: System administrator managing agencies, memberships, commissions, and platform operations.

---

## API Categories & Endpoints

### 1. Health & System Status

| Method | Endpoint                   | Auth   | Description                                                    |
| :----- | :------------------------- | :----- | :------------------------------------------------------------- |
| `GET`  | `/api/v1/health`           | Public | Core health status check (DB connectivity & system info)       |
| `GET`  | `/api/v1/health/liveness`  | Public | Liveness probe (process uptime check)                          |
| `GET`  | `/api/v1/health/readiness` | Public | Readiness probe (verifies DB & optional integration providers) |

---

### 2. Authentication & Identity (`/auth`)

| Method | Endpoint                          | Auth    | Description                                                  |
| :----- | :-------------------------------- | :------ | :----------------------------------------------------------- |
| `POST` | `/api/v1/auth/register/traveller` | Public  | Register new Traveller account & auto-login                  |
| `POST` | `/api/v1/auth/register/agency`    | Public  | Register new Travel Agency account (requires admin approval) |
| `POST` | `/api/v1/auth/login`              | Public  | Account login with email & password                          |
| `POST` | `/api/v1/auth/google`             | Public  | Google OAuth login for Travellers                            |
| `POST` | `/api/v1/auth/refresh`            | Cookie  | Rotate refresh session token (HttpOnly cookie)               |
| `POST` | `/api/v1/auth/logout`             | Session | Revoke current session & clear cookie                        |
| `POST` | `/api/v1/auth/logout-all`         | Bearer  | Revoke all active sessions for current user                  |
| `GET`  | `/api/v1/auth/me`                 | Bearer  | Get current user identity & role profile                     |

---

### 3. Traveller Profile (`/travellers`)

| Method  | Endpoint                | Auth      | Description                                                  |
| :------ | :---------------------- | :-------- | :----------------------------------------------------------- |
| `GET`   | `/api/v1/travellers/me` | Traveller | Retrieve current traveller profile & identity                |
| `PATCH` | `/api/v1/travellers/me` | Traveller | Update traveller personal details (name, phone, dob, locale) |

---

### 4. Route Planning (`/routes`)

| Method   | Endpoint                   | Auth      | Description                                                      |
| :------- | :------------------------- | :-------- | :--------------------------------------------------------------- |
| `POST`   | `/api/v1/routes/calculate` | Traveller | Calculate route distance, duration & geometry without persisting |
| `POST`   | `/api/v1/routes`           | Traveller | Calculate and persist new route                                  |
| `GET`    | `/api/v1/routes/:id`       | Traveller | Get details of own saved route                                   |
| `PATCH`  | `/api/v1/routes/:id`       | Traveller | Update own saved route                                           |
| `DELETE` | `/api/v1/routes/:id`       | Traveller | Delete route (fails with `400 ROUTE_IN_USE` if referenced)       |

---

### 5. Travel Requests (`/travel-requests`)

| Method   | Endpoint                                  | Auth      | Description                                                  |
| :------- | :---------------------------------------- | :-------- | :----------------------------------------------------------- |
| `POST`   | `/api/v1/travel-requests`                 | Traveller | Create new draft travel request (standalone or inline route) |
| `GET`    | `/api/v1/travel-requests`                 | Traveller | List all travel requests owned by current traveller          |
| `GET`    | `/api/v1/travel-requests/:id`             | Traveller | Retrieve details of specific travel request                  |
| `PATCH`  | `/api/v1/travel-requests/:id`             | Traveller | Update draft travel request details                          |
| `POST`   | `/api/v1/travel-requests/:id/submit`      | Traveller | Transition travel request status from `draft` to `submitted` |
| `POST`   | `/api/v1/travel-requests/:id/cancel`      | Traveller | Cancel request (`draft` or `submitted` -> `cancelled`)       |
| `POST`   | `/api/v1/travel-requests/:id/days`        | Traveller | Add an itinerary day to draft request                        |
| `PATCH`  | `/api/v1/travel-requests/:id/days/:dayId` | Traveller | Update an itinerary day in draft request                     |
| `DELETE` | `/api/v1/travel-requests/:id/days/:dayId` | Traveller | Delete an itinerary day from draft request                   |

---

### 6. Agency Matching & Leads (`/agency/travel-requests`)

| Method | Endpoint                                  | Auth   | Description                                                                 |
| :----- | :---------------------------------------- | :----- | :-------------------------------------------------------------------------- |
| `GET`  | `/api/v1/agency/travel-requests`          | Agency | Matched requests inbox (paginated: `?page=&pageSize=&matchStatus=&status=`) |
| `GET`  | `/api/v1/agency/travel-requests/:id`      | Agency | Detail of matched request (contact protected pre-acceptance)                |
| `POST` | `/api/v1/agency/travel-requests/:id/view` | Agency | Mark matched request status as `viewed`                                     |

---

### 7. Quotations (`/agency` & `/travel-requests`)

#### Agency Endpoints

| Method  | Endpoint                                        | Auth   | Description                                                |
| :------ | :---------------------------------------------- | :----- | :--------------------------------------------------------- |
| `POST`  | `/api/v1/agency/travel-requests/:id/quotations` | Agency | Create draft quotation for matched request                 |
| `GET`   | `/api/v1/agency/quotations`                     | Agency | List agency's own quotations                               |
| `GET`   | `/api/v1/agency/quotations/:id`                 | Agency | Get detail of agency's own quotation                       |
| `PATCH` | `/api/v1/agency/quotations/:id`                 | Agency | Edit agency's draft quotation                              |
| `POST`  | `/api/v1/agency/quotations/:id/submit`          | Agency | Submit quotation (`draft` -> `submitted`)                  |
| `POST`  | `/api/v1/agency/quotations/:id/withdraw`        | Agency | Withdraw quotation (`draft` or `submitted` -> `withdrawn`) |

#### Traveller Endpoints

| Method | Endpoint                                 | Auth      | Description                                       |
| :----- | :--------------------------------------- | :-------- | :------------------------------------------------ |
| `GET`  | `/api/v1/travel-requests/:id/quotations` | Traveller | List submitted quotations for traveller's request |
| `GET`  | `/api/v1/quotations/:id`                 | Traveller | View detailed quotation comparison breakdown      |

---

### 8. Quotation Acceptance & Job Creation

| Method | Endpoint                        | Auth      | Description                                                               |
| :----- | :------------------------------ | :-------- | :------------------------------------------------------------------------ |
| `POST` | `/api/v1/quotations/:id/accept` | Traveller | Accept submitted quotation (creates Job, locks request, reveals contacts) |

---

### 9. Jobs & Execution (`/jobs`)

| Method  | Endpoint                  | Auth          | Description                                                                       |
| :------ | :------------------------ | :------------ | :-------------------------------------------------------------------------------- |
| `GET`   | `/api/v1/jobs`            | Authenticated | List jobs (Traveller/Agency see own; Admin sees all)                              |
| `GET`   | `/api/v1/jobs/:id`        | Authenticated | Get job details (Participants & Admin)                                            |
| `PATCH` | `/api/v1/jobs/:id/status` | Participants  | Transition job status (`accepted` -> `in_progress` -> `completed` \| `cancelled`) |

---

### 10. Messaging & Realtime (`/conversations`)

| Method  | Endpoint                             | Auth          | Description                                                   |
| :------ | :----------------------------------- | :------------ | :------------------------------------------------------------ |
| `GET`   | `/api/v1/conversations`              | Authenticated | List active conversation threads (Traveller/Agency/Admin)     |
| `POST`  | `/api/v1/conversations`              | Authenticated | Create or retrieve existing request-bound conversation thread |
| `GET`   | `/api/v1/conversations/:id`          | Authenticated | Get conversation thread details                               |
| `GET`   | `/api/v1/conversations/:id/messages` | Authenticated | Get paginated message history for thread                      |
| `POST`  | `/api/v1/conversations/:id/messages` | Participants  | Send message in thread (emits Socket.IO event)                |
| `PATCH` | `/api/v1/conversations/:id/read`     | Participants  | Mark messages in conversation as read                         |

_Realtime Socket.IO Server runs on the main HTTP server at `/socket.io` with Bearer auth token authentication._

---

### 11. Notifications & Push Tokens (`/notifications`)

| Method  | Endpoint                             | Auth          | Description                                              |
| :------ | :----------------------------------- | :------------ | :------------------------------------------------------- |
| `GET`   | `/api/v1/notifications`              | Authenticated | Fetch paginated notification history (`?limit=&offset=`) |
| `GET`   | `/api/v1/notifications/unread-count` | Authenticated | Get current unread notification count                    |
| `PATCH` | `/api/v1/notifications/:id/read`     | Authenticated | Mark a single notification as read                       |
| `PATCH` | `/api/v1/notifications/read-all`     | Authenticated | Mark all notifications for user as read                  |
| `POST`  | `/api/v1/notifications/push-token`   | Authenticated | Register FCM push notification token for mobile device   |

---

### 12. Weather Forecast (`/weather`)

| Method | Endpoint          | Auth   | Description                                              |
| :----- | :---------------- | :----- | :------------------------------------------------------- |
| `GET`  | `/api/v1/weather` | Public | Get destination weather forecast (`?destination=&date=`) |

---

### 13. Travel Guide - Public (`/travel-guide`)

| Method | Endpoint                                  | Auth   | Description                                              |
| :----- | :---------------------------------------- | :----- | :------------------------------------------------------- |
| `GET`  | `/api/v1/travel-guide/regions`            | Public | List active travel regions                               |
| `GET`  | `/api/v1/travel-guide/destinations`       | Public | List active travel destinations (`?regionId=`)           |
| `GET`  | `/api/v1/travel-guide/destinations/:slug` | Public | Get destination details by URL slug                      |
| `GET`  | `/api/v1/travel-guide/articles`           | Public | List published travel guide articles (`?destinationId=`) |
| `GET`  | `/api/v1/travel-guide/articles/:slug`     | Public | Get article details by URL slug                          |

---

### 14. Ratings & Reviews (`/jobs` & `/agencies`)

| Method | Endpoint                              | Auth          | Description                                         |
| :----- | :------------------------------------ | :------------ | :-------------------------------------------------- |
| `POST` | `/api/v1/jobs/:jobId/rating`          | Traveller     | Submit rating (1 to 5 stars) for completed job      |
| `GET`  | `/api/v1/jobs/:jobId/rating`          | Authenticated | Retrieve submitted rating for specific job          |
| `GET`  | `/api/v1/agencies/:id/rating-summary` | Public        | Retrieve public aggregate rating summary for agency |

---

### 15. Admin - Agency Management (`/admin/agencies`)

| Method | Endpoint                                                  | Auth  | Description                                                      |
| :----- | :-------------------------------------------------------- | :---- | :--------------------------------------------------------------- |
| `GET`  | `/api/v1/admin/agencies`                                  | Admin | List agency accounts and approval statuses                       |
| `GET`  | `/api/v1/admin/agencies/:id`                              | Admin | Get complete agency details and submitted verification documents |
| `POST` | `/api/v1/admin/agencies/:id/approve`                      | Admin | Approve agency account registration                              |
| `POST` | `/api/v1/admin/agencies/:id/reject`                       | Admin | Reject agency account registration                               |
| `POST` | `/api/v1/admin/agencies/:id/suspend`                      | Admin | Suspend active agency account                                    |
| `POST` | `/api/v1/admin/agencies/:id/reactivate`                   | Admin | Reactivate suspended agency account                              |
| `POST` | `/api/v1/admin/agencies/:id/documents/:documentId/verify` | Admin | Verify agency submitted compliance document                      |
| `POST` | `/api/v1/admin/agencies/:id/documents/:documentId/reject` | Admin | Reject agency submitted compliance document                      |

---

### 16. Admin - Memberships & Subscriptions (`/admin`)

| Method  | Endpoint                                        | Auth  | Description                                   |
| :------ | :---------------------------------------------- | :---- | :-------------------------------------------- |
| `GET`   | `/api/v1/admin/membership-plans`                | Admin | List membership plans                         |
| `POST`  | `/api/v1/admin/membership-plans`                | Admin | Create new membership plan                    |
| `PATCH` | `/api/v1/admin/membership-plans/:id`            | Admin | Edit existing membership plan                 |
| `GET`   | `/api/v1/admin/memberships`                     | Admin | List all agency active/inactive memberships   |
| `GET`   | `/api/v1/admin/memberships/:id`                 | Admin | Get membership subscription details           |
| `POST`  | `/api/v1/admin/memberships/:id/confirm-payment` | Admin | Confirm offline payment for agency membership |
| `POST`  | `/api/v1/admin/memberships/:id/suspend`         | Admin | Suspend agency membership subscription        |
| `POST`  | `/api/v1/admin/memberships/:id/reactivate`      | Admin | Reactivate suspended membership subscription  |
| `PATCH` | `/api/v1/admin/memberships/:id`                 | Admin | Modify membership subscription record         |
| `POST`  | `/api/v1/admin/agencies/:agencyId/membership`   | Admin | Assign membership plan directly to an agency  |

---

### 17. Admin - Commissions & Financials (`/admin/commissions`)

| Method  | Endpoint                               | Auth  | Description                                                       |
| :------ | :------------------------------------- | :---- | :---------------------------------------------------------------- |
| `GET`   | `/api/v1/admin/commissions`            | Admin | List system commission records                                    |
| `GET`   | `/api/v1/admin/commissions/summary`    | Admin | Get commission financial summary & metrics                        |
| `GET`   | `/api/v1/admin/commissions/:id`        | Admin | Get specific commission details                                   |
| `PATCH` | `/api/v1/admin/commissions/:id/status` | Admin | Update commission payment status (`pending`, `paid`, `cancelled`) |

---

### 18. Admin - Operations, Dashboard & Monitoring (`/admin`)

| Method | Endpoint                            | Auth  | Description                                             |
| :----- | :---------------------------------- | :---- | :------------------------------------------------------ |
| `GET`  | `/api/v1/admin/dashboard`           | Admin | Retrieve operational dashboard metrics and summary KPIs |
| `GET`  | `/api/v1/admin/metrics`             | Admin | Alias endpoint for operational dashboard metrics        |
| `GET`  | `/api/v1/admin/travel-requests`     | Admin | Search and view all platform travel requests            |
| `GET`  | `/api/v1/admin/travel-requests/:id` | Admin | View specific platform travel request detail            |
| `GET`  | `/api/v1/admin/jobs`                | Admin | Search and view all platform jobs                       |
| `GET`  | `/api/v1/admin/jobs/:id`            | Admin | View specific platform job detail                       |

---

### 19. Admin - Audit Logging (`/admin/audit-logs`)

| Method | Endpoint                   | Auth  | Description                                        |
| :----- | :------------------------- | :---- | :------------------------------------------------- |
| `GET`  | `/api/v1/admin/audit-logs` | Admin | List & filter system security & audit trail events |

---

### 20. Admin - Travel Guide Content Management (`/admin/travel-guide`)

| Method   | Endpoint                                            | Auth  | Description                                 |
| :------- | :-------------------------------------------------- | :---- | :------------------------------------------ |
| `GET`    | `/api/v1/admin/travel-guide/regions`                | Admin | List all regions (including draft/inactive) |
| `POST`   | `/api/v1/admin/travel-guide/regions`                | Admin | Create new travel region                    |
| `PATCH`  | `/api/v1/admin/travel-guide/regions/:id`            | Admin | Update region details                       |
| `DELETE` | `/api/v1/admin/travel-guide/regions/:id`            | Admin | Delete region                               |
| `GET`    | `/api/v1/admin/travel-guide/destinations`           | Admin | List all destinations                       |
| `POST`   | `/api/v1/admin/travel-guide/destinations`           | Admin | Create destination                          |
| `PATCH`  | `/api/v1/admin/travel-guide/destinations/:id`       | Admin | Update destination                          |
| `DELETE` | `/api/v1/admin/travel-guide/destinations/:id`       | Admin | Delete destination                          |
| `GET`    | `/api/v1/admin/travel-guide/articles`               | Admin | List all travel articles                    |
| `POST`   | `/api/v1/admin/travel-guide/articles`               | Admin | Create article draft                        |
| `GET`    | `/api/v1/admin/travel-guide/articles/:id`           | Admin | Get article details                         |
| `PATCH`  | `/api/v1/admin/travel-guide/articles/:id`           | Admin | Update article content                      |
| `POST`   | `/api/v1/admin/travel-guide/articles/:id/publish`   | Admin | Publish article to public travel guide      |
| `POST`   | `/api/v1/admin/travel-guide/articles/:id/unpublish` | Admin | Unpublish article                           |
| `DELETE` | `/api/v1/admin/travel-guide/articles/:id`           | Admin | Delete article                              |

---

### 21. Admin - Ratings & Review Oversight (`/admin/ratings`)

| Method | Endpoint                        | Auth  | Description                                      |
| :----- | :------------------------------ | :---- | :----------------------------------------------- |
| `GET`  | `/api/v1/admin/ratings`         | Admin | List all customer ratings across platform jobs   |
| `GET`  | `/api/v1/admin/ratings/summary` | Admin | Get global average rating and feedback analytics |

---
