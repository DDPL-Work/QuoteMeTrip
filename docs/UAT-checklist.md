# User Acceptance Testing (UAT) Checklist

**Project:** Troublefree Holiday  
**Phase:** 9 — Production Hardening & UAT

This checklist documents the complete end-to-end acceptance scenarios for validating application workflows before production release.

---

### End-to-End Scenarios

- [ ] **SCENARIO 1: Traveller Registration & Authentication**
  - Register new traveller account via email/password.
  - Verify JWT access token and HTTP-only refresh cookie issuance.
  - Verify `/api/v1/auth/me` identity endpoint.

- [ ] **SCENARIO 2: Traveller Route Creation**
  - Plan multi-stop route (origin, intermediate stops, final destination).
  - Verify route distance and recommended day calculations.
  - Save route and verify ownership.

- [ ] **SCENARIO 3: Travel Request Creation**
  - Create travel request from saved route with dates, budget range, and traveller count.
  - Submit request and verify status transition to `submitted`.

- [ ] **SCENARIO 4: Admin Agency Approval**
  - Admin logs in and views pending agency registrations.
  - Admin verifies uploaded agency documents.
  - Admin approves agency and logs audit event.

- [ ] **SCENARIO 5: Admin Membership Activation**
  - Admin views agency membership status.
  - Admin confirms manual payment for membership plan.
  - Verify membership status becomes `active`.

- [ ] **SCENARIO 6: Agency Request Matching & Inbox**
  - Matching engine matches submitted request with eligible active agencies.
  - Agency logs in and views request in agency inbox.

- [ ] **SCENARIO 7: Agency Quotation Submission**
  - Agency creates itemized quotation draft with pricing and terms.
  - Agency submits quotation to traveller.

- [ ] **SCENARIO 8: Traveller ↔ Agency Messaging**
  - Traveller initiates conversation with quoting agency.
  - Real-time Socket.IO messages sent and received.
  - Verify contact details remain masked prior to quotation acceptance.

- [ ] **SCENARIO 9: Traveller Accepts Quotation**
  - Traveller reviews submitted quotations side-by-side.
  - Traveller accepts quotation.
  - Verify rival quotations set to `withdrawn` or unaccepted state.

- [ ] **SCENARIO 10: Automatic Job Creation**
  - Verification that accepting a quotation creates a Job record in `accepted` state.
  - Unmask contact details for traveller and agency on live job creation.

- [ ] **SCENARIO 11: Agency Updates Job Status**
  - Agency transitions job status from `accepted` -> `in_progress`.
  - Notification dispatched to traveller.

- [ ] **SCENARIO 12: Job Completion**
  - Agency marks job status as `completed`.
  - Final job state updated.

- [ ] **SCENARIO 13: Traveller Rating Submission**
  - Traveller submits 1–5 star rating with written feedback for completed job.
  - Agency aggregate rating updated.
  - Duplicate ratings blocked.

- [ ] **SCENARIO 14: Commission Calculation**
  - System calculates platform commission upon job completion according to agency plan.
  - Admin verifies commission record in Admin portal.

- [ ] **SCENARIO 15: Travel Guide Content Management**
  - Admin creates and edits Travel Guide article in draft mode.
  - Article published by Admin.

- [ ] **SCENARIO 16: Public Travel Guide Access**
  - Unauthenticated user views published Travel Guide articles on public website.
  - Draft/unpublished articles remain hidden from public API.

- [ ] **SCENARIO 17: Weather Integration & Fallback**
  - Weather forecast displayed for route stops when provider is active.
  - Non-blocking fallback when weather API key is missing or service unavailable.

- [ ] **SCENARIO 18: Notification Delivery**
  - In-app notifications generated for request matching, quotation, job status change.
  - Email/SMS providers fail gracefully without interrupting core transactions.
