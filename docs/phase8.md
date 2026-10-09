# TROUBLEFREE HOLIDAY

# PHASE 8 — NOTIFICATIONS, WEATHER, TRAVEL GUIDE CMS & RATINGS

## CURRENT STATUS

Completed:

- Phase 1 — Foundation
- Phase 2 — Database / ORM
- Phase 3 — Authentication / Identity / RBAC
- Phase 4 — Traveller Route Planning / Travel Requests
- Phase 5 — Agency Matching / Quotations
- Phase 6 — Messaging / Contact Protection / Quotation Acceptance / Jobs
- Phase 7 — Admin Operations / Agency Approval / Membership / Commission / Audit Logging

Track B completed:

- Traveller Public Website V1

All current tests are green.

DO NOT rewrite completed phases.

---

## PHASE OBJECTIVE

Implement the remaining Standard-platform capabilities:

1. Notification system
2. Email notifications
3. SMS notifications for defined critical events
4. Firebase web push notifications
5. Notification preferences/read state
6. Weather integration
7. Weather display in Traveller trip workflow
8. Travel Guide CMS
9. Travel Guide public API integration
10. Region and destination management
11. Article creation/editing/publishing
12. Traveller post-service ratings
13. Agency rating aggregation
14. Public agency rating display
15. Rating-based agency sorting

Keep all implementations modular and provider-agnostic.

---

## IMPORTANT SCOPE BOUNDARY

IMPLEMENT:

- Notifications
- Weather
- Travel Guide CMS
- Ratings

DO NOT IMPLEMENT:

- Payment gateway
- Marketplace split payment
- Digital contracts
- E-signature
- AI
- Mobile apps
- Advanced route optimization
- Advanced BI

These remain future Pro / Phase 9+ scope.

---

# 1. NOTIFICATION ARCHITECTURE

Existing notification event architecture from earlier phases must be reused.

Do not create a second event-bus implementation.

Suggested structure:

backend/src/modules/notifications/

- notification.constants.js
- notification.service.js
- notification.repository.js
- notification.mapper.js
- notification.routes.js
- notification.preferences.js
- providers/
  - email.provider.js
  - sms.provider.js
  - web-push.provider.js

Use provider abstractions.

Business logic must emit domain events.

Notification providers consume those events.

---

# 2. NOTIFICATION DATA MODEL

Create:

notifications

Fields:

- id
- user_id
- event_type
- channel
- title
- body
- data
- status
- read_at
- sent_at
- failed_at
- failure_reason
- created_at
- updated_at

Channels:

- in_app
- email
- sms
- web_push

Statuses:

- pending
- sent
- failed
- read

Use normalized relationships and appropriate indexes.

Important indexes:

- user_id
- event_type
- status
- created_at
- (user_id, read_at)

Do not store passwords, tokens, secrets, or sensitive credentials.

---

# 3. NOTIFICATION EVENTS

Support existing and new business events.

Examples:

- AGENCY_APPROVED
- AGENCY_REJECTED
- AGENCY_SUSPENDED
- MEMBERSHIP_ACTIVATED
- MEMBERSHIP_EXPIRING
- MEMBERSHIP_SUSPENDED
- PAYMENT_CONFIRMED
- TRAVEL_REQUEST_SUBMITTED
- AGENCY_MATCHED
- QUOTATION_SUBMITTED
- QUOTATION_ACCEPTED
- MESSAGE_RECEIVED
- JOB_CREATED
- JOB_STATUS_CHANGED
- CONTACT_REVEALED
- RATING_REQUESTED
- RATING_SUBMITTED

WEATHER_AVAILABLE / WEATHER_ERROR should not necessarily be user notifications unless explicitly required by the business workflow.

Use the existing notification event naming convention.

---

# 4. NOTIFICATION DELIVERY

Channels:

EMAIL:

- new travel request
- new quotation
- quotation acceptance
- agency approval
- membership events
- other agreed transactional events

SMS:
Only critical events.

Do not send SMS for every notification.

Critical examples:

- quotation accepted
- membership suspension/warning

WEB PUSH:
Use Firebase Cloud Messaging for browser notifications.

Provider credentials must remain environment variables.

Do not commit credentials.

---

# 5. NOTIFICATION TRANSACTION RULE

Never make a successful database business transaction depend on third-party notification delivery.

Correct flow:

BEGIN business transaction
↓
persist business state
↓
COMMIT
↓
emit notification event
↓
notification provider attempts delivery

Provider failure must not roll back:

- travel request
- quotation
- acceptance
- job
- membership
- commission
- etc.

---

# 6. NOTIFICATION API

Implement:

GET /api/v1/notifications
GET /api/v1/notifications/unread-count
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all

Optional notification preference API:

GET /api/v1/notification-preferences
PATCH /api/v1/notification-preferences

User can control non-critical channels if the business rule allows it.

Critical transactional notifications must not be silently disabled if required by the business workflow.

---

# 7. NOTIFICATION UI

Traveller:

- bell icon
- unread count
- notification dropdown/page

Agency:

- bell icon
- unread count
- notification list

Admin:

- notification display may remain minimal unless needed

Use reusable components:

- NotificationBell
- NotificationList
- NotificationItem
- UnreadBadge

---

# 8. EMAIL PROVIDER

Use the existing integrations/email abstraction.

Do not couple notification service directly to a provider.

Suggested:

integrations/email/email.provider.js

Method:

send({
to,
subject,
html,
text
})

Templates should be separated from business services.

---

# 9. SMS PROVIDER

Use the existing integrations/sms abstraction.

Suggested:

send({
to,
message
})

If provider credentials are missing:

- log provider-unavailable state safely
- do not crash business workflows
- do not expose credentials/errors to clients

---

# 10. FIREBASE WEB PUSH

Use Firebase Cloud Messaging for web push.

Store browser/device push tokens securely.

Create:

push_tokens

Fields:

- id
- user_id
- token
- platform
- last_used_at
- created_at
- updated_at

Use unique token constraint.

Endpoints:

POST /api/v1/notifications/push-token
DELETE /api/v1/notifications/push-token

Web push delivery must be provider-isolated.

---

# 11. WEATHER INTEGRATION

Existing weather integration boundary must be reused.

Do not create a duplicate weather subsystem.

Requirements:

- destination/date based weather request
- loading state
- error state
- fallback state
- provider abstraction
- optional caching

Suggested endpoint:

GET /api/v1/weather

Parameters:

- destination
- date

or a route/request-aware endpoint if current architecture already supports it.

Do not block Travel Request creation because weather is unavailable.

---

# 12. WEATHER CACHE

If caching is useful within the current architecture:

Create:

weather_cache

Fields may include:

- location_key
- date
- provider
- response
- expires_at
- created_at
- updated_at

Use a reasonable cache expiry.

Do not introduce Redis solely for weather.

MySQL caching is acceptable unless the existing architecture already provides another approved cache mechanism.

---

# 13. WEATHER UI

Traveller should see weather information naturally inside the travel planning/request experience.

Potential display:

- destination
- date
- temperature
- condition
- rain probability
- wind/humidity if provider supplies it

Do not invent weather fields unavailable from provider.

Provide:

- loading
- error
- unavailable
- success

Weather should enhance the planning workflow, not block it.

---

# 14. TRAVEL GUIDE CMS

Create Admin-managed Travel Guide backend.

Entities:

- travel_guide_regions
- travel_guide_destinations
- travel_guide_articles

If the existing schema already contains some/all entities, reuse them instead of creating duplicates.

---

# 15. REGIONS

Admin endpoints:

GET /api/v1/admin/travel-guide/regions
POST /api/v1/admin/travel-guide/regions
PATCH /api/v1/admin/travel-guide/regions/:id
DELETE /api/v1/admin/travel-guide/regions/:id

Fields:

- name
- slug
- description
- image
- status
- sort_order
- created_at
- updated_at

---

# 16. DESTINATIONS

Admin endpoints:

GET /api/v1/admin/travel-guide/destinations
POST /api/v1/admin/travel-guide/destinations
PATCH /api/v1/admin/travel-guide/destinations/:id
DELETE /api/v1/admin/travel-guide/destinations/:id

Fields:

- region_id
- name
- slug
- description
- short_description
- image
- country
- status
- sort_order
- created_at
- updated_at

Use unique slugs.

---

# 17. ARTICLES

Admin endpoints:

GET /api/v1/admin/travel-guide/articles
POST /api/v1/admin/travel-guide/articles
GET /api/v1/admin/travel-guide/articles/:id
PATCH /api/v1/admin/travel-guide/articles/:id
DELETE /api/v1/admin/travel-guide/articles/:id
POST /api/v1/admin/travel-guide/articles/:id/publish
POST /api/v1/admin/travel-guide/articles/:id/unpublish

Fields:

- region_id
- destination_id
- title
- slug
- excerpt
- content
- cover_image
- status
- published_at
- author_id
- created_at
- updated_at

Statuses:

- draft
- published
- archived

Do not expose drafts publicly.

---

# 18. PUBLIC TRAVEL GUIDE API

Public endpoints:

GET /api/v1/travel-guide/regions
GET /api/v1/travel-guide/destinations
GET /api/v1/travel-guide/articles
GET /api/v1/travel-guide/articles/:slug

Only published content is public.

The public Traveller website Track B must stop depending on temporary mock data for Travel Guide once these APIs are ready.

Replace only the API layer.

Do not rewrite public UI components unnecessarily.

---

# 19. PUBLIC DESTINATION API

Provide public destination data to support:

- /destinations
- /destinations/:slug

Reuse destination entities from Travel Guide CMS.

Do not create a second destination table for the public site.

---

# 20. PUBLIC AGENCY DATA

Keep existing public-safe agency serialization.

Do not expose:

- email
- phone
- WhatsApp
- private membership information
- admin notes
- internal documents

Use rating information only after Phase 8 rating data exists.

---

# 21. RATINGS

Create:

ratings

Fields:

- id
- job_id
- travel_request_id
- traveller_id
- agency_id
- rating
- created_at
- updated_at

Rating:

1–5

No written reviews.

This matches the agreed Standard scope.

---

# 22. RATING RULES

Only eligible Traveller may submit rating.

Eligibility:

- Traveller owns job
- Job belongs to agency
- Job status = completed

One rating per completed job.

Rating cannot be submitted before service completion.

Rating value must be integer:

1
2
3
4
5

No written review field.

---

# 23. RATING API

Traveller:

POST /api/v1/jobs/:jobId/rating
GET /api/v1/jobs/:jobId/rating

Public/Agency:

GET /api/v1/agencies/:id/rating-summary

Admin:

GET /api/v1/admin/ratings
GET /api/v1/admin/ratings/summary

Avoid exposing Traveller identity unnecessarily on public rating summaries.

---

# 24. AGENCY RATING AGGREGATION

Agency rating summary:

- averageRating
- ratingCount

Calculate safely.

Do not maintain duplicated aggregates unless there is a measured performance need.

Rating sorting endpoint may support:

sort=rating_desc

Do not replace default agency list behavior unless existing business rules require rating-based default sorting.

The agreed scope states that the "Our Agencies" page is sorted by rating by default; implement this once real ratings exist.

---

# 25. RATING UI — TRAVELLER

After completed job:

Rate your experience

★ ★ ★ ★ ★

Submit Rating

No text review field.

Prevent duplicate submission.

---

# 26. RATING UI — AGENCY

Agency dashboard/profile:

- Average rating
- Rating count

Do not expose individual private Traveller information.

---

# 27. RATING UI — PUBLIC TRAVELLER WEBSITE

Agency cards can display:

★★★★★ 4.7
123 ratings

ONLY when actual rating data exists.

Do not use placeholder rating numbers in production UI.

---

# 28. ADMIN TRAVEL GUIDE UI

Add Admin pages:

- /travel-guide/regions
- /travel-guide/destinations
- /travel-guide/articles
- /travel-guide/articles/new
- /travel-guide/articles/:id

Admin features:

- create
- edit
- publish
- unpublish
- archive
- search
- filter
- pagination

Use clean CMS-oriented forms.

---

# 29. ADMIN RATINGS UI

Add:

- /ratings

Show:

- agency
- rating
- job
- date
- status/context

No written reviews exist in this model.

---

# 30. MULTILINGUAL CONTENT

IMPORTANT:

The existing UI has EN/TR interface translations.

For Travel Guide content itself, design the schema so future multilingual content can be supported without destroying the current implementation.

Do NOT over-engineer full translation workflows unless needed.

At minimum, document how localized article content will evolve.

---

# 31. FRONTEND PUBLIC WEBSITE INTEGRATION

Replace current mock public data ONLY where backend APIs now exist.

Affected:

- Destinations
- Destination Details
- Travel Guide
- Travel Guide Details
- Agencies
- Agency Rating Display

Keep fallback handling if public API is unavailable.

Maintain:

- loading
- success
- empty
- error

Do not reintroduce duplicated mock data after API integration.

---

# 32. NOTIFICATION UI INTEGRATION

Traveller:

- notification bell
- unread count
- notifications page

Agency:

- notification bell
- unread count
- notifications page

Integrate push registration into authenticated browser sessions.

Do not register push tokens for unauthenticated users.

---

# 33. SECURITY

Never expose:

- email credentials
- SMS provider credentials
- Firebase service-account credentials
- API keys
- passwords
- JWT secrets

Use environment variables.

All Admin CMS endpoints require:

- authenticated
- admin role

Rating creation requires:

- authenticated
- traveller role
- eligible completed job

Public Travel Guide endpoints expose only published content.

---

# 34. TRANSACTIONS

Use transactions where multiple records change.

Examples:

- publish article + audit
- rating + required aggregate update if used
- membership/job event + notification event creation if persisted

Do not make external provider delivery part of the primary transaction.

---

# 35. AUDIT LOGGING

Reuse Phase 7 audit logging.

Audit important Admin CMS operations:

- region.created
- region.updated
- region.deleted
- destination.created
- destination.updated
- destination.deleted
- article.created
- article.updated
- article.published
- article.unpublished
- article.archived
- rating-related administrative operations where appropriate

---

# 36. TESTING — NOTIFICATIONS

Test:

- notification creation
- unread count
- mark read
- mark all read
- event routing
- provider failure isolation
- email provider abstraction
- SMS provider abstraction
- push token registration
- duplicate push token prevention

---

# 37. TESTING — WEATHER

Test:

- valid weather request
- provider success
- provider unavailable
- invalid destination/date
- cache hit
- cache expiry if cache implemented
- request workflow continues without weather

---

# 38. TESTING — TRAVEL GUIDE

Test:

- region creation
- destination creation
- article creation
- draft article not publicly visible
- publish article
- unpublish article
- published article public API
- slug uniqueness
- public article detail
- Admin authorization

---

# 39. TESTING — RATINGS

Test:

- completed job can be rated
- non-completed job rejected
- wrong traveller rejected
- wrong job rejected
- duplicate rating rejected
- rating outside 1–5 rejected
- rating summary calculation
- rating sorting

---

# 40. FRONTEND TESTS

Traveller:

- notification bell
- unread badge
- notification list
- weather component
- published Travel Guide
- destination API integration
- agency rating display
- completed job rating form

Agency:

- notification list
- unread state
- rating summary

Admin:

- region CRUD
- destination CRUD
- article CRUD
- publish/unpublish
- ratings page

Existing Phase 1–7 tests must remain green.

---

# 41. API CLIENT

Extend:

@troublefree/api-client

with:

- notification APIs
- weather APIs
- public Travel Guide APIs
- Admin Travel Guide APIs
- rating APIs
- public agency rating APIs

Do not create scattered direct fetch calls.

---

# 42. TYPES

Extend:

@troublefree/types

with:

- NotificationChannel
- NotificationStatus
- WeatherResponse
- TravelGuideRegion
- TravelGuideDestination
- TravelGuideArticle
- Rating
- AgencyRatingSummary

Follow current package conventions.

---

# 43. DOCUMENTATION

Create/update:

- docs/notifications.md
- docs/weather.md
- docs/travel-guide.md
- docs/ratings.md

Update:

- docs/api.md
- docs/database.md
- docs/testing.md

Document:

- provider abstractions
- environment variables
- notification events
- weather fallback behavior
- Travel Guide publishing workflow
- rating eligibility
- rating aggregation

---

# 44. ENVIRONMENT VARIABLES

Document only required variables.

Expected categories:

- EMAIL_PROVIDER configuration
- SMS_PROVIDER configuration
- FIREBASE configuration
- WEATHER provider configuration

All providers must support a disabled/unconfigured development mode where core application functionality remains testable.

Do not hardcode credentials.

---

# 45. LIVE ACCEPTANCE FLOW

Verify:

NOTIFICATION:

Admin approves agency
→ notification created/emitted

Traveller submits request
→ agency matching
→ agency notification

Agency submits quotation
→ traveller notification

Traveller accepts quotation
→ agency notification

MESSAGE:
Traveller sends message
→ agency notification/event

JOB:
Job completed
→ traveller receives rating request

WEATHER:
Traveller enters destination/date
→ weather shown or graceful unavailable state

TRAVEL GUIDE:
Admin creates article
→ draft
→ publish
→ appears on public Traveller site

RATING:
Traveller completes job
→ submits 1–5 rating
→ Agency rating summary updates
→ public agency card can display actual rating

---

# 46. UI DESIGN

Continue the established QuoteMeTrip design system.

Traveller public:

- Light Green #2E9E5B
- Yellow #F5C518
- White/light surfaces
- Dark charcoal text

Traveller public site remains consumer-oriented.

Admin Travel Guide CMS remains operational/data-dense.

Do not introduce a separate visual system.

---

# 47. VALIDATION

Run:

npm install
npm run lint
npm run format:check
npm run build
npm test

Run:

- backend tests
- traveller tests
- agency tests
- admin tests
- api-client tests

Verify:

GET /api/v1/health

Verify migration:

up
down
up

Verify complete regression:

- Phase 1
- Phase 2
- Phase 3
- Phase 4
- Phase 5
- Phase 6
- Phase 7
- Traveller Public Website V1

---

# 48. PHASE BOUNDARY

DO NOT IMPLEMENT:

- payment gateway
- split payment
- e-signature
- contracts
- AI
- mobile
- advanced BI
- advanced route optimization

STOP AFTER PHASE 8.

---

# 49. FINAL REPORT

Provide:

1. Files changed
2. Migrations added
3. Models added/modified
4. Associations
5. API endpoints
6. Notification events
7. Provider abstractions
8. Weather implementation
9. Travel Guide CMS
10. Public Travel Guide integration
11. Rating implementation
12. Admin pages
13. Traveller pages
14. Agency pages
15. Tests added
16. Exact test counts
17. Lint result
18. Format result
19. Build result
20. Migration validation
21. Live acceptance results
22. Environment variables
23. Known limitations
24. Confirmation Phase 9+ / Pro scope was NOT implemented

============================================================
END OF PHASE 8 REQUIREMENTS
============================================================
