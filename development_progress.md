# QuoteMyTrip — Development Progress Report

> **Project:** QuoteMyTrip (Internal: Troublefree Holiday)
> **Technology:** React.js · Node.js / Express.js · MySQL · Socket.IO
> **Date:** 3 October 2026
> **Status:** Core Platform Complete — Production Hardening Pass Finished

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1 — Project Foundation](#3-phase-1--project-foundation)
4. [Phase 2 — Database & ORM](#4-phase-2--database--orm)
5. [Phase 3 — Authentication & Identity](#5-phase-3--authentication--identity)
6. [Phase 4 — Traveller Portal](#6-phase-4--traveller-portal)
7. [Phase 5 — Agency Portal & Quotations](#7-phase-5--agency-portal--quotations)
8. [Phase 6 — Messaging, Jobs & Acceptance](#8-phase-6--messaging-jobs--acceptance)
9. [Phase 7 — Admin Portal & Operations](#9-phase-7--admin-portal--operations)
10. [Phase 8 — Public Website & Travel Guide](#10-phase-8--public-website--travel-guide)
11. [Messaging Workspace Redesign](#11-messaging-workspace-redesign)
12. [App Shell Architecture Overhaul](#12-app-shell-architecture-overhaul)
13. [Performance & Hardening Pass](#13-performance--hardening-pass)
14. [Agency Onboarding Formalities](#14-agency-onboarding-formalities)
15. [Database Schema — Full Migration Inventory](#15-database-schema--full-migration-inventory)
16. [Test Coverage](#16-test-coverage)
17. [API Surface](#17-api-surface)
18. [Documentation Inventory](#18-documentation-inventory)
19. [File Inventory Summary](#19-file-inventory-summary)
20. [Known Constraints & Future Work](#20-known-constraints--future-work)

---

## 1. Executive Summary

QuoteMyTrip is a **two-sided travel marketplace** connecting Travellers with tourism Agencies. The platform has been built from scratch across 8+ development phases, covering:

- **3 web applications** — Traveller, Agency, Admin
- **1 shared backend** — RESTful API with realtime WebSocket layer
- **30 database models** with 35 migrations
- **18 backend modules** with full service / controller / repository layering
- **Shared monorepo packages** — API client, i18n, UI kit, config, types
- **26 test files** — unit, integration, e2e structure
- **30 documentation files** covering every subsystem

The full travel-request → quotation → acceptance → job → rating lifecycle is operational across all three portals.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React.js + Vite)               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Traveller  │  │   Agency   │  │   Admin    │            │
│  │  :5173      │  │   :5174    │  │   :5175    │            │
│  └─────┬───────┘  └─────┬──────┘  └─────┬──────┘            │
│        └────────────────┼───────────────┘                    │
│                   @troublefree/api-client                    │
│                   @troublefree/i18n                          │
│                   @troublefree/ui                            │
│                   @troublefree/config                        │
│                   @troublefree/types                         │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                 BACKEND (Node.js + Express.js)              │
│                        :5001                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware: CORS · Helmet · Rate Limiter · Auth      │   │
│  │             Validation · Upload · Error Handler       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Modules (18):                                        │   │
│  │  auth · traveller · agency-profile · agency-matching  │   │
│  │  routes · travel-requests · quotations · messaging    │   │
│  │  jobs · acceptance · commissions · notifications      │   │
│  │  ratings · audit · admin · travel-guide · weather     │   │
│  │  contact                                              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Realtime: Socket.IO (presence + messaging events)    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Integrations: AI · Email · E-signature · Firebase    │   │
│  │                Maps · Payments · SMS · Weather        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Caching: In-memory cache (Redis-compatible API)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  DATABASE (MySQL)                            │
│  30 Models · 35 Migrations · Composite Indexes              │
│  Foreign keys with documented ON DELETE/UPDATE behavior      │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
troublefree-holiday/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express app setup
│   │   ├── server.js                 # HTTP + Socket.IO bootstrap
│   │   ├── config/                   # CORS, environment
│   │   ├── db/
│   │   │   ├── models/ (30 models)   # Sequelize ORM models
│   │   │   ├── migrations/ (35)      # Schema migrations
│   │   │   ├── seeders/              # Seed data
│   │   │   └── sequelize.js          # DB connection
│   │   ├── integrations/ (8)         # Third-party services
│   │   ├── lib/                      # Redis/cache layer
│   │   ├── middleware/ (9)           # Auth, validation, uploads
│   │   ├── modules/ (18)            # Domain modules
│   │   ├── realtime/                 # Socket.IO server
│   │   ├── routes/                   # API route registry
│   │   └── utils/                    # JWT, helpers
│   ├── tests/
│   │   ├── unit/ (6 files)
│   │   ├── integration/ (18 files)
│   │   └── e2e/
│   └── scripts/                      # CLI tools (migrate, seed, admin)
├── web/
│   ├── apps/
│   │   ├── traveller/                # Traveller SPA
│   │   ├── agency/                   # Agency SPA
│   │   └── admin/                    # Admin SPA
│   └── packages/
│       ├── api-client/               # Shared HTTP boundary
│       ├── config/                   # Shared configuration
│       ├── i18n/                     # Internationalization
│       ├── types/                    # Shared TypeScript types
│       └── ui/                       # Shared UI components
└── docs/ (30 files)                  # Technical documentation
```

---

## 3. Phase 1 — Project Foundation

| Item | Status |
|------|--------|
| Monorepo workspace setup | ✅ Complete |
| Backend Express.js scaffold | ✅ Complete |
| Environment configuration (.env) | ✅ Complete |
| CORS middleware | ✅ Complete |
| Helmet security headers | ✅ Complete |
| Rate limiting | ✅ Complete |
| Request correlation IDs | ✅ Complete |
| Request logging | ✅ Complete |
| Error handling middleware | ✅ Complete |
| 404 not-found handler | ✅ Complete |
| Health check endpoint (`/health`) | ✅ Complete |
| Vite dev server configuration | ✅ Complete |
| `.editorconfig`, `.prettierrc` | ✅ Complete |

### Key Files
- [`backend/src/app.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/app.js) — Express application setup
- [`backend/src/server.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/server.js) — HTTP + Socket.IO bootstrap
- [`backend/src/middleware/`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/middleware/) — All middleware (9 files)

---

## 4. Phase 2 — Database & ORM

| Item | Status |
|------|--------|
| MySQL connection with Sequelize | ✅ Complete |
| 30 Sequelize models | ✅ Complete |
| Centralized model registry (`models/index.js`) | ✅ Complete |
| Full foreign key strategy (documented) | ✅ Complete |
| Migration framework | ✅ Complete |
| Seeder framework | ✅ Complete |
| CLI scripts (`db:migrate`, `db:seed`, etc.) | ✅ Complete |

### Database Models (30)

| Model | Purpose |
|-------|---------|
| `User` | Core identity (email, password hash, role) |
| `TravellerProfile` | Traveller personal info, profile picture, cover image |
| `AgencyProfile` | Agency business info, approval status, onboarding |
| `AgencyDocument` | Agency verification documents |
| `MembershipPlan` | Subscription plan definitions |
| `AgencyMembership` | Agency ↔ Plan subscription records |
| `AuthSession` | Refresh token sessions |
| `AuthIdentity` | OAuth / social login provider links |
| `Route` | Calculated travel routes |
| `RouteStop` | Individual stops within a route |
| `TravelRequest` | Full travel request with preferences |
| `TravelRequestDay` | Day-by-day itinerary details |
| `TravelRequestAgency` | Agency ↔ Request matching records |
| `Quotation` | Agency quotation with pricing |
| `QuotationItem` | Line items within a quotation |
| `Conversation` | Messaging thread between traveller and agency |
| `Message` | Individual message with deletion + TTL support |
| `Job` | Active service engagement (accepted quotation) |
| `Commission` | Platform commission records |
| `AuditLog` | Administrative audit trail |
| `Notification` | In-app notification records |
| `PushToken` | Firebase push notification tokens |
| `WeatherCache` | Cached weather API responses |
| `TravelGuideRegion` | Travel guide geographic regions |
| `TravelGuideDestination` | Travel guide destinations |
| `TravelGuideArticle` | Travel guide content articles |
| `Rating` | Post-service 1–5 star ratings |
| `AgencyCoverage` | Agency service coverage areas |
| `AgencyCapability` | Agency service capabilities |

### Key Files
- [`backend/src/db/models/index.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/db/models/index.js) — Centralized model registry with all associations (594 lines)
- [`backend/src/db/sequelize.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/db/sequelize.js) — Connection management

---

## 5. Phase 3 — Authentication & Identity

| Item | Status |
|------|--------|
| JWT access + refresh token system | ✅ Complete |
| HttpOnly refresh cookie (no localStorage) | ✅ Complete |
| In-memory access token | ✅ Complete |
| Single-flight token refresh | ✅ Complete |
| Bcrypt password hashing | ✅ Complete |
| Role-based access control (traveller / agency / admin) | ✅ Complete |
| Google OAuth social login | ✅ Complete |
| Session management (login, logout, logout-all) | ✅ Complete |
| `RequireAuth` / `RequireRole` / `PublicOnly` guards | ✅ Complete |
| `AuthProvider` + `AuthContext` (React) | ✅ Complete |
| 401 interceptor with automatic retry | ✅ Complete |

### Key Files
- [`backend/src/modules/auth/`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/modules/auth/) — 7 files: routes, controller, service, repository, mapper, validation, constants
- [`web/packages/api-client/src/index.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/packages/api-client/src/index.js) — Shared HTTP client with token handling (578 lines)

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/register/traveller` | Traveller registration |
| `POST` | `/auth/register/agency` | Agency registration |
| `POST` | `/auth/login` | Email/password login |
| `POST` | `/auth/google` | Google OAuth login |
| `POST` | `/auth/refresh` | Token refresh |
| `POST` | `/auth/logout` | Single session logout |
| `POST` | `/auth/logout-all` | All sessions logout |
| `GET` | `/auth/me` | Current user profile |

---

## 6. Phase 4 — Traveller Portal

| Item | Status |
|------|--------|
| Traveller profile management | ✅ Complete |
| Profile picture upload/persist | ✅ Complete |
| Cover image upload/persist | ✅ Complete |
| Map-first route planning (RouteMap + RoutePlanner) | ✅ Complete |
| Start / intermediate / final destination selection | ✅ Complete |
| Route visualization on map | ✅ Complete |
| Distance & travel time calculation | ✅ Complete |
| Recommended days calculation | ✅ Complete |
| Day-by-day planner (DayCard, DayPlanner) | ✅ Complete |
| Accommodation preference (3/4/5-star, S Class) | ✅ Complete |
| Travel request form (25+ fields) | ✅ Complete |
| Travel request submission workflow | ✅ Complete |
| Request listing with status filters | ✅ Complete |
| Request detail page | ✅ Complete |
| Quotation listing + comparison | ✅ Complete |
| Quotation detail + acceptance | ✅ Complete |
| Weather integration on trip planning | ✅ Complete |
| Dashboard with metrics | ✅ Complete |
| Traveller app layout (sidebar + main) | ✅ Complete |
| Responsive mobile bottom nav | ✅ Complete |
| App preloader animation | ✅ Complete |

### Traveller Pages (12)
| Page | File |
|------|------|
| Dashboard | [`dashboard.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/dashboard.jsx) |
| Profile | [`profile.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/profile.jsx) |
| Plan Trip | [`plan-trip.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/plan-trip.jsx) |
| Travel Requests | [`travel-requests.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/travel-requests.jsx) |
| Request Detail | [`travel-request-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/travel-request-detail.jsx) |
| Quotation Detail | [`quotation-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/quotation-detail.jsx) |
| Quotation Comparison | [`quotation-comparison.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/quotation-comparison.jsx) |
| Messages | [`messages.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/messages.jsx) |
| Conversation Detail | [`conversation-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/conversation-detail.jsx) |
| Jobs | [`jobs.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/jobs.jsx) |
| Job Detail | [`job-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/job-detail.jsx) |
| Auth (Login/Register) | [`auth.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/pages/auth.jsx) |

### Traveller Components (36+)
Key components include: `RoutePlanner`, `RouteMap`, `RouteSummaryCard`, `TravelRequestForm`, `RequestReview`, `DayByDayPlanner`, `DayCard`, `QuotationCard`, `QuotationDetail`, `QuotationItemList`, `ChatWorkspace`, `WeatherCard`, `JobRatingSection`, `UserMenu`, `AppSidebar`, `AppHeader`, `MobileBottomNav`, `MobileHeader`, `Phase6` (Blue Cruise), and more.

---

## 7. Phase 5 — Agency Portal & Quotations

| Item | Status |
|------|--------|
| Agency registration + login | ✅ Complete |
| Agency profile management | ✅ Complete |
| Agency coverage/capability management | ✅ Complete |
| Intelligent agency matching (region/destination) | ✅ Complete |
| Incoming travel request dashboard | ✅ Complete |
| Request detail view | ✅ Complete |
| Request mark-viewed tracking | ✅ Complete |
| Quotation creation (hotel / vehicle / full package) | ✅ Complete |
| Quotation item editor | ✅ Complete |
| Quotation preview modal | ✅ Complete |
| Quotation submission + withdrawal | ✅ Complete |
| Quotation summary + totals | ✅ Complete |
| My Quotations listing | ✅ Complete |
| Contact information filtering (pre-acceptance) | ✅ Complete |
| Contact reveal (post-acceptance) | ✅ Complete |
| Agency app layout with sidebar | ✅ Complete |

### Agency Pages (13)
| Page | File |
|------|------|
| Dashboard | [`dashboard.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/dashboard.jsx) |
| Incoming Requests | [`incoming-requests.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/incoming-requests.jsx) |
| Request Detail | [`request-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/request-detail.jsx) |
| Create Quotation | [`create-quotation.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/create-quotation.jsx) |
| My Quotations | [`my-quotations.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/my-quotations.jsx) |
| Quotation Detail | [`quotation-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/quotation-detail.jsx) |
| Quotation Edit | [`quotation-edit.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/quotation-edit.jsx) |
| Messages | [`messages.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/messages.jsx) |
| Conversation Detail | [`conversation-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/conversation-detail.jsx) |
| Jobs | [`jobs.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/jobs.jsx) |
| Job Detail | [`job-detail.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/job-detail.jsx) |
| Profile | [`profile.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/profile.jsx) |
| Auth (Login/Register) | [`auth.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/pages/auth.jsx) |

### Agency Components (15)
`AgencyRequestCard`, `AgencyRequestDetail`, `AgencyRequestList`, `AgencyQuotationList`, `AgencyQuotationDetail`, `QuotationForm`, `QuotationItemEditor`, `QuotationPreviewModal`, `QuotationSummary`, `QuotationTotals`, `QuotationTypeSelector`, `ChatWorkspace`, `AgencyOnboardingWizard`, `AgencyDashboardSkeleton`, `Phase6`.

---

## 8. Phase 6 — Messaging, Jobs & Acceptance

| Item | Status |
|------|--------|
| Conversation creation (per travel request) | ✅ Complete |
| Message sending (REST-persisted) | ✅ Complete |
| Message listing with pagination | ✅ Complete |
| Message deletion (for-me / for-everyone) | ✅ Complete |
| Disappearing messages (TTL control) | ✅ Complete |
| Message expiry enforcement | ✅ Complete |
| Socket.IO realtime delivery | ✅ Complete |
| JWT-authenticated WebSocket connections | ✅ Complete |
| Room-based conversation joining (membership verified) | ✅ Complete |
| Online/offline presence tracking | ✅ Complete |
| Presence broadcast (`presence:update` events) | ✅ Complete |
| Presence query (`presence:get` event) | ✅ Complete |
| Read receipts (`markRead`) | ✅ Complete |
| Quotation acceptance workflow | ✅ Complete |
| Job creation on acceptance | ✅ Complete |
| Job status transitions (accepted → in_progress → completed) | ✅ Complete |
| Contact reveal on acceptance | ✅ Complete |
| Post-service rating (1–5 stars) | ✅ Complete |
| Contact masking in messages | ✅ Complete |
| ChatWorkspace — WhatsApp/Messenger-style UX | ✅ Complete |

### Realtime Architecture
- **Protocol:** Socket.IO over WebSocket
- **Auth:** Bearer token verified on connection
- **Rooms:** `conversation:<id>` — membership checked server-side
- **Presence:** In-memory `Map` tracking socket IDs per user
- **Events:** `message:new`, `message:deleted`, `message:updated`, `presence:update`
- **Principle:** REST persists, sockets only deliver — sockets are never the source of truth

### Key Files
- [`backend/src/modules/messaging/`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/modules/messaging/) — 7 files (constants, controller, mapper, repository, routes, service, validation)
- [`backend/src/realtime/socket.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/realtime/socket.js) — Socket.IO server (196 lines)
- [`backend/src/modules/contact/contact-visibility.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/modules/contact/contact-visibility.js) — Contact masking/reveal logic

### ChatWorkspace Features
- Conversation sidebar with search, unread badges, last-message preview
- Real-time message delivery with Socket.IO
- Message bubbles with sent/delivered/read indicators
- Online/offline presence indicators (green dot)
- "Last seen" timestamps
- Message deletion (for-me / for-everyone)
- Disappearing messages with TTL selector
- Typing-style message animations
- Auto-scroll to latest message
- Chat header with participant info
- Responsive layout (mobile ↔ desktop)

---

## 9. Phase 7 — Admin Portal & Operations

| Item | Status |
|------|--------|
| Admin authentication (role-gated) | ✅ Complete |
| Admin dashboard with metrics | ✅ Complete |
| Agency listing, search & filtering | ✅ Complete |
| Agency approval / rejection | ✅ Complete |
| Agency suspension / reactivation | ✅ Complete |
| Agency document verification | ✅ Complete |
| Membership plan management (CRUD) | ✅ Complete |
| Agency membership assignment | ✅ Complete |
| Payment confirmation (manual) | ✅ Complete |
| Membership suspension / reactivation | ✅ Complete |
| Commission tracking & status management | ✅ Complete |
| Commission summary reports | ✅ Complete |
| Travel request operational visibility | ✅ Complete |
| Job operational visibility | ✅ Complete |
| Audit logging (all admin actions) | ✅ Complete |
| Rating overview | ✅ Complete |
| Travel guide content management | ✅ Complete |

### Admin API Surface (25+ endpoints)
All admin endpoints are role-gated (`admin` only) and produce audit log entries for state-changing operations.

---

## 10. Phase 8 — Public Website & Travel Guide

| Item | Status |
|------|--------|
| Public homepage | ✅ Complete |
| Destinations listing page | ✅ Complete |
| Destination detail page | ✅ Complete |
| Travel guide articles listing | ✅ Complete |
| Travel guide article detail | ✅ Complete |
| Agencies public listing | ✅ Complete |
| Agency public detail (with ratings) | ✅ Complete |
| About page | ✅ Complete |
| Contact page | ✅ Complete |
| Public layout (header, footer, nav) | ✅ Complete |
| SEO meta tags per page | ✅ Complete |

### Public Routes (9)
`/` · `/destinations` · `/destinations/:slug` · `/travel-guide` · `/travel-guide/:slug` · `/agencies` · `/agencies/:id` · `/about` · `/contact`

---

## 11. Messaging Workspace Redesign

A comprehensive redesign was performed on the messaging workspace for both Traveller and Agency portals, targeting a **WhatsApp Web / Facebook Messenger-style UX**.

| Feature | Status |
|---------|--------|
| Split-panel layout (sidebar + chat) | ✅ Complete |
| Conversation list with avatar, name, last message, time | ✅ Complete |
| Unread message badges | ✅ Complete |
| Conversation search | ✅ Complete |
| Message bubbles (sender/receiver alignment) | ✅ Complete |
| Online/offline presence dots | ✅ Complete |
| Last-seen timestamps | ✅ Complete |
| Delete for me / delete for everyone | ✅ Complete |
| Disappearing messages TTL selector | ✅ Complete |
| Chat header with participant info | ✅ Complete |
| Auto-scroll to bottom | ✅ Complete |
| Empty state illustrations | ✅ Complete |
| Mobile-responsive panel switching | ✅ Complete |
| Real-name chat identity (not email) | ✅ Complete |
| Traveller profile picture in chat | ✅ Complete |

### Key Files
- [`web/apps/traveller/src/components/ChatWorkspace.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/components/ChatWorkspace.jsx) — 51,812 bytes
- [`web/apps/agency/src/components/ChatWorkspace.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/components/ChatWorkspace.jsx) — 50,746 bytes

---

## 12. App Shell Architecture Overhaul

The application shell was completely redesigned to resolve fundamental layout issues (nested scrollbars, sidebar scrolling with content, viewport overflow).

### Before
- Sidebar and main content behaved as one large document
- Browser scrollbar + content scrollbar + chat scrollbar (triple nested)
- Sidebar moved when main content scrolled

### After (ChatGPT-style architecture)
- `100vh` fixed viewport with `overflow: hidden` on root
- Sidebar and main panel are **completely independent scroll regions**
- Each region manages its own scrollbar
- No page-level scrolling — only region-level scrolling
- Fixed header, fixed sidebar, scrollable main content area

### Key Files
- [`web/apps/traveller/src/layouts/TravellerAppLayout.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/traveller/src/layouts/TravellerAppLayout.jsx)
- [`web/apps/agency/src/layouts/AgencyAppLayout.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/layouts/AgencyAppLayout.jsx)

---

## 13. Performance & Hardening Pass

### Database Indexing
Added 10 composite indexes across high-frequency tables via [`202610030004-add-performance-indexes.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/db/migrations/202610030004-add-performance-indexes.js):

| Table | Index |
|-------|-------|
| `travel_requests` | `(traveller_id, status, created_at)` |
| `travel_requests` | `(status, created_at)` |
| `quotations` | `(travel_request_id, status)` |
| `quotations` | `(agency_id, status, created_at)` |
| `conversations` | `(traveller_id, agency_id)` |
| `conversations` | `(updated_at)` |
| `messages` | `(conversation_id, created_at)` |
| `notifications` | `(user_id, status, created_at)` |
| `jobs` | `(agency_id, status, created_at)` |
| `jobs` | `(traveller_id, status, created_at)` |

### Caching Layer
- [`backend/src/lib/redis.js`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/lib/redis.js) — Redis-compatible API with in-memory fallback
- Namespaced caching with automatic TTL
- `cache.remember(key, ttl, fetcherFn)` pattern for transparent cache-aside
- Zero-crash fallback: MySQL remains authoritative source of truth
- Pattern-based cache invalidation (`delPattern`)

### Pagination
All list endpoints support cursor/offset pagination with `limit`, `offset`, and `page` parameters.

### Media Cleanup
- Old profile pictures and cover images are physically deleted from storage when replaced
- `resolveMediaUrl()` utility normalizes media URLs across all portals

---

## 14. Agency Onboarding Formalities

A formal 4-step onboarding wizard was implemented to enforce business requirements before an agency becomes operational.

### Onboarding Steps

| Step | Name | Description |
|------|------|-------------|
| 1 | Profile Verification | Review agency profile completeness |
| 2 | Document Upload | Upload required business documents (license, tax certificate, registration, identity) |
| 3 | Membership Agreement | Accept terms and conditions |
| 4 | Admin Review | Wait for admin approval — agency cannot operate until approved |

### Business Rules Enforced
- ❌ Agency is **never** auto-approved after registration
- ❌ Agency cannot receive travel requests until approved by admin
- ✅ Documents are validated server-side (MIME type, file size, extension)
- ✅ Agreement acceptance is persisted in database
- ✅ `isOperational` flag blocks matching for unapproved agencies
- ✅ Full `pending → submitted → approved | rejected` status workflow

### Key Files
- [`web/apps/agency/src/components/AgencyOnboardingWizard.jsx`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/apps/agency/src/components/AgencyOnboardingWizard.jsx) — 614 lines, 23 KB
- [`backend/src/modules/agency-profile/`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/backend/src/modules/agency-profile/) — Onboarding API endpoints

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/agency/onboarding-status` | Get current onboarding state |
| `GET` | `/agency/documents` | List uploaded documents |
| `POST` | `/agency/documents` | Upload a document |
| `DELETE` | `/agency/documents/:id` | Remove a document |
| `POST` | `/agency/agreement` | Accept membership agreement |
| `POST` | `/agency/onboarding/submit` | Submit for admin review |

---

## 15. Database Schema — Full Migration Inventory

| # | Migration | Purpose |
|---|-----------|---------|
| 1 | `202609230001-create-users` | Core users table |
| 2 | `202609230002-create-traveller-profiles` | Traveller profile data |
| 3 | `202609230003-create-agency-profiles` | Agency profile data |
| 4 | `202609230004-create-agency-documents` | Document upload records |
| 5 | `202609230005-create-membership-plans` | Subscription plan definitions |
| 6 | `202609230006-create-agency-memberships` | Agency subscription records |
| 7 | `202609240001-create-auth-sessions` | JWT refresh sessions |
| 8 | `202609240002-create-auth-identities` | OAuth provider links |
| 9 | `202609240003-add-last-login-to-users` | Last login tracking |
| 10 | `202609240004-create-routes` | Travel route calculations |
| 11 | `202609240005-create-route-stops` | Route stop waypoints |
| 12 | `202609240006-create-travel-requests` | Travel request records |
| 13 | `202609240007-create-travel-request-days` | Day-by-day itinerary |
| 14 | `202609240008-create-travel-request-agencies` | Agency matching records |
| 15 | `202609240009-create-quotations` | Agency quotations |
| 16 | `202609240010-create-quotation-items` | Quotation line items |
| 17 | `202609240011-create-conversations` | Messaging conversations |
| 18 | `202609240012-create-messages` | Chat messages |
| 19 | `202609240013-create-jobs` | Service job records |
| 20 | `202609240014-create-commissions` | Platform commissions |
| 21 | `202609240015-create-audit-logs` | Admin audit trail |
| 22 | `202609240016-extend-agency-memberships` | Extended membership fields |
| 23 | `202609240017-create-notifications` | In-app notifications |
| 24 | `202609240018-create-push-tokens` | Push notification tokens |
| 25 | `202609240019-create-weather-cache` | Weather response cache |
| 26 | `202609240020-create-travel-guide-regions` | Travel guide regions |
| 27 | `202609240021-create-travel-guide-destinations` | Travel guide destinations |
| 28 | `202609240022-create-travel-guide-articles` | Travel guide articles |
| 29 | `202609240023-create-ratings` | Rating records |
| 30 | `202609300001-add-blue-cruise-to-travel-requests` | Blue cruise support |
| 31 | `202610010001-create-agency-coverage-and-capabilities` | Agency coverage areas |
| 32 | `202610030001-add-profile-picture-and-cover-image` | Traveller media fields |
| 33 | `202610030002-add-deletion-fields-to-messages` | Message deletion support |
| 34 | `202610030003-add-ttl-and-expires-at` | Disappearing messages |
| 35 | `202610030004-add-performance-indexes` | Composite query indexes |

---

## 16. Test Coverage

### Backend Tests (26 files)

#### Unit Tests (6 files)
| File | Coverage |
|------|----------|
| `health.test.js` | Health endpoint |
| `auth.test.js` | Token generation, password hashing, validation |
| `models.test.js` | All 30 model definitions and associations |
| `route.test.js` | Route calculation and stop ordering |
| `matching.test.js` | Agency matching algorithm |
| `messaging.test.js` | Message service logic |
| `blue_cruise.test.js` | Blue cruise travel type |

#### Integration Tests (18 files)
| File | Coverage |
|------|----------|
| `auth.test.js` | Full auth flows (register, login, refresh, OAuth) |
| `database.test.js` | DB connection and model sync |
| `migrations.test.js` | Migration up/down with count validation |
| `seeders.test.js` | Seed data integrity |
| `travel.test.js` | Route + travel request CRUD |
| `quotations.test.js` | Quotation lifecycle |
| `messaging.test.js` | Conversation + message CRUD |
| `socket.test.js` | WebSocket auth + room joining |
| `acceptance.test.js` | Quotation acceptance + job creation |
| `admin-operations.test.js` | Admin agency/membership management |
| `notifications.test.js` | Notification CRUD |
| `ratings.test.js` | Rating submission |
| `travel-guide.test.js` | Travel guide CRUD |
| `weather.test.js` | Weather API integration |
| `production-hardening.test.js` | Production config validation |
| `profile-media.test.js` | Profile picture/cover upload |
| `ttl-presence.test.js` | Disappearing messages + presence |

#### Frontend Tests (1 file)
| File | Coverage |
|------|----------|
| `phase1_foundation.test.jsx` | Traveller app foundation rendering |

---

## 17. API Surface

### Shared API Client Methods

The [`@troublefree/api-client`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/web/packages/api-client/src/index.js) package exposes 12 API factory functions:

| Factory | Portal | Endpoints |
|---------|--------|-----------|
| `createAuthApi` | All | 8 methods (register, login, OAuth, refresh, logout, me) |
| `createTravellerApi` | Traveller | 4 methods (me, update, profile pic, cover) |
| `createRouteApi` | Traveller | 5 methods (calculate, create, get, update, remove) |
| `createTravelRequestApi` | Traveller | 10 methods (CRUD, submit, cancel, days, quotations) |
| `createTravellerQuotationApi` | Traveller | 2 methods (get, accept) |
| `createAgencyRequestApi` | Agency | 3 methods (list, get, markViewed) |
| `createAgencyProfileApi` | Agency | 9 methods (profile, coverage, onboarding, documents, agreement) |
| `createAgencyQuotationApi` | Agency | 6 methods (create, list, get, update, submit, withdraw) |
| `createMessagingApi` | Both | 8 methods (conversations, messages, delete, read, TTL) |
| `createJobApi` | Both | 5 methods (list, get, updateStatus, submitRating, getRating) |
| `createNotificationApi` | Both | 4 methods (list, unread, markRead, markAll) |
| `createAdminApi` | Admin | 25+ methods (agencies, memberships, commissions, audit, visibility) |
| `createAgencyRatingApi` | Both | 1 method (ratingSummary) |
| `createTravelGuideApi` | Public | 5 methods (regions, destinations, articles) |
| `createWeatherApi` | Traveller | 1 method (forecast) |

---

## 18. Documentation Inventory

All documentation is in the [`docs/`](file:///c:/Users/ashish%20kathait/Downloads/troublefree-holiday/docs/) directory:

| Document | Purpose |
|----------|---------|
| `api.md` | Full API documentation (22 KB) |
| `architecture.md` | System architecture overview |
| `authentication.md` | Auth flow documentation |
| `database.md` | Schema and ER documentation |
| `messaging-and-jobs.md` | Messaging + job workflow |
| `quotation-workflow.md` | Quotation lifecycle |
| `travel-request-workflow.md` | Request submission workflow |
| `agency-matching-and-quotations.md` | Matching algorithm documentation |
| `admin-operations.md` | Admin portal operations |
| `membership-and-commission.md` | Subscription management |
| `notification-events.md` | Notification event types |
| `notifications.md` | Notification system |
| `permissions.md` | RBAC permissions matrix |
| `ratings.md` | Rating system |
| `travel-guide.md` | Travel guide content management |
| `weather.md` | Weather integration |
| `security.md` | Security practices |
| `testing.md` | Test strategy and infrastructure |
| `deployment.md` | Deployment configuration |
| `nginx.conf` | Production Nginx config |
| `database-backup-restore.md` | DB backup/restore procedures |
| `production-release-checklist.md` | Release checklist |
| `rollback-plan.md` | Rollback procedures |
| `UAT-checklist.md` | User acceptance testing |
| `traveller-public-website.md` | Public website documentation |
| `messaging.md` | Messaging subsystem |
| `integrations.md` | Third-party integrations |
| `audit-logging.md` | Audit log documentation |
| `phase8.md` | Phase 8 technical spec |
| `phase8-completion.md` | Phase 8 completion report |

---

## 19. File Inventory Summary

| Category | Count |
|----------|-------|
| Database models | 30 |
| Database migrations | 35 |
| Backend modules | 18 |
| Backend middleware | 9 |
| Backend integrations | 8 |
| Backend test files | 26 |
| Traveller pages | 12 + 9 public |
| Traveller components | 36+ |
| Agency pages | 13 |
| Agency components | 15 |
| Shared packages | 5 |
| API client factory functions | 15 |
| Total API endpoints | ~100+ |
| Documentation files | 30 |
| CSS stylesheets | 5 |

---

## 20. Known Constraints & Future Work

### Documented Constraints
- **No Pro-only modules** in current scope (AI recommendations, mobile app, payment gateway, e-signatures)
- **Contact masking** is a safety net, not a guarantee — determined users can obfuscate details
- **Presence tracking** is in-memory (not distributed across multiple backend instances)
- **Caching layer** is in-memory with Redis-compatible API — swap to Redis for multi-instance deployments
- **Multiple agency sub-users** are not part of Version 1

### Production Readiness Checklist
- [x] All core business flows operational
- [x] Database migrations versioned and reversible
- [x] JWT security with httpOnly cookies
- [x] Rate limiting on all endpoints
- [x] Input validation on all mutation endpoints
- [x] Audit logging for admin operations
- [x] Error handling with correlation IDs
- [x] Responsive layouts (desktop + mobile)
- [x] WebSocket authentication
- [x] Contact protection pre-acceptance
- [x] Performance indexes applied
- [ ] Production Redis instance (currently in-memory fallback)
- [ ] Email/SMS integration configuration
- [ ] Firebase push notification setup
- [ ] Payment gateway integration (Pro)
- [ ] SSL/TLS certificates
- [ ] Production Nginx deployment

---

> **Report generated:** 3 October 2026
> **Coverage:** All 8+ development phases, messaging redesign, app shell architecture, performance hardening, and agency onboarding formalities.
