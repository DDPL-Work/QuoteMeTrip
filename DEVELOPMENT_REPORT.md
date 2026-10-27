# QuoteMeTrip (Troublefree Holiday) — Comprehensive Project Development Report

**Date:** October 2026  
**Document Version:** 1.0.0  
**Target Audience:** Client & Stakeholders  
**Architecture:** Monorepo (Node.js/Express Backend, React Frontends, Shared Core Packages)

---

## 1. Executive Summary

**QuoteMeTrip** (Troublefree Holiday) is a modern B2B2C travel ecosystem designed to connect global travellers with verified local Turkish travel agencies. The platform automates customized itinerary requests, multi-agency quotation bidding, seamless in-app booking confirmation, real-time multilingual messaging, and end-to-end compliance verification.

The platform is engineered using modern software architectural standards:
* **Separation of Concerns:** Independent, purpose-built web portals for **Travellers**, **Agencies**, and **Super Admins**.
* **High Security & Compliance:** Dual-token JWT authentication with HttpOnly cookies, strict password policies, automated session management, and encrypted storage.
* **Real-time Capabilities:** Instant bi-directional messaging, notification broadcasting, and typing/read statuses powered by Socket.io.
* **Internationalization:** Native multi-language support (English and Turkish) across all portals with live message translation.
* **Responsive First:** Optimized for all screen sizes from mobile smartphones (360px+) to 4K desktop displays.

---

## 2. System Architecture & Tech Stack

```
                                  ┌─────────────────────────────┐
                                  │      Client Browsers        │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
                   ▼                             ▼                             ▼
        ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
        │   Traveller Portal  │       │    Agency Portal    │       │    Admin Portal     │
        │  (React 18 / Vite)  │       │  (React 18 / Vite)  │       │  (React 18 / Vite)  │
        └──────────┬──────────┘       └──────────┬──────────┘       └──────────┬──────────┘
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 │ HTTPS / WSS
                                                 ▼
                                      ┌─────────────────────┐
                                      │   Express Backend   │
                                      │   (REST + Socket)   │
                                      └──────────┬──────────┘
                                                 │
            ┌─────────────────────┬──────────────┴──────────────┬─────────────────────┐
            │                     │                             │                     │
            ▼                     ▼                             ▼                     ▼
 ┌─────────────────────┐ ┌──────────────────┐        ┌─────────────────────┐ ┌──────────────────┐
 │     MySQL 8.0       │ │   Firebase FCM   │        │ Google Cloud Trans. │ │   Weather API    │
 │ (Sequelize / ACID)  │ │  (Push Alerts)   │        │  (Auto-translate)   │ │ (Dest. Forecast) │
 └─────────────────────┘ └──────────────────┘        └─────────────────────┘ └──────────────────┘
```

### Technology Matrix

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Backend Runtime** | Node.js (v20+ / v24+), Express.js 4.21 |
| **Database & ORM** | MySQL 8.0, Sequelize ORM 6.37, Knex/MySQL2 migration runner |
| **Realtime Engine** | Socket.io 4.8 (WebSocket + fallback polling) |
| **Frontends** | React 18, Vite 5, React Router 6, Framer Motion |
| **State & API** | In-memory token management, Custom typed API client (`@troublefree/api-client`) |
| **Styling & UI** | Shared Design Tokens, CSS Variables, `@troublefree/ui` Component Library |
| **Security** | Helmet, CORS, Express-Rate-Limit, BCryptJS, JsonWebToken |
| **Testing** | Node native test runner (`node:test`), Vitest |

---

## 3. Platform Portals & Feature Breakdown

### 3.1. Traveller Portal (`web/apps/traveller`)
Designed for an intuitive travel planning experience.
* **Trip Request Builder:**
  * Multi-step request wizard: Destinations, dates, traveler counts (adults/children/infants), hotel tier, pace, and special interests.
  * Interactive destination picker covering top Turkish regions (Istanbul, Cappadocia, Antalya, Bodrum, Pamukkale, etc.).
* **Route & Day-by-Day Planner:**
  * Visual route maps, recommended stops, and travel duration calculations.
  * Day-by-day itinerary view with activities, transport modes, and inclusions.
* **Quotation Review & Comparison:**
  * Receive competitive quotations from multiple verified agencies.
  * Itemized cost breakdowns: accommodation, transfers, guided tours, admissions.
  * One-click quote acceptance and booking confirmation.
* **Interactive Live Chat:**
  * Real-time text messaging with quoting agencies.
  * Media and document attachment sharing.
  * Real-time automated Turkish-English translation.
* **Destination Context:**
  * Live destination weather forecasts powered by OpenWeather.
  * Curated local travel guides and region highlights.
* **Reputation & Feedback:**
  * Agency review and rating submission post-trip.
* **Account & Security:**
  * Profile details editor (avatar upload, personal contact information).
  * **Change Password Modal:** In-app secure password updates with real-time length and match validation.
  * **Global Session Revocation:** One-click "Sign out from all devices" for compromised accounts.

---

### 3.2. Agency Portal (`web/apps/agency`)
Built for travel agencies to receive qualified leads, create quotes, and manage bookings.
* **4-Step Onboarding & Verification Wizard:**
  1. *Business Details Overview:* Agency legal name, TURSAB license number, corporate tax ID, headquarters, and key contacts.
  2. *Compliance Document Uploads:* Operating license, liability insurance certificate, tax registration certificate.
  3. *Membership Agreement:* Terms of service, commission schedules, and service level agreements (SLAs).
  4. *Review & Submission:* Verification queue submission for Admin review.
* **Lead Matching & Request Feed:**
  * Automated matching algorithm feeding relevant travel requests based on agency regions and service capabilities.
  * Filter by budget, duration, destination, and passenger count.
* **Quotation Builder & Submission:**
  * Customized proposal generation with itemized cost pricing.
  * Dynamic terms and validity date limits.
  * Status tracker (Pending, Accepted, Rejected, Expired).
* **Confirmed Jobs Execution:**
  * Workflow management for confirmed passenger bookings.
  * Itinerary milestones, passenger lists, and fulfillment tracking.
* **Real-time Communication:**
  * Dedicated chat thread per quotation/job with travellers.
  * Auto-translation toggle for agencies communicating with international travellers.
* **Account Security & Staff Management:**
  * **Change Password Center:** Available both in the top header user dropdown and the Profile "Account Security" card.
  * Membership status indicators (Verified Partner Agency badge).

---

### 3.3. Admin Portal (`web/apps/admin`)
Central control tower for platform governance, verification, and oversight.
* **Executive Metrics Dashboard:**
  * Platform overview: Total GMV, active quote requests, completed jobs, agency verification queue.
* **Agency Verification & Compliance Management:**
  * Complete list of registered travel agencies with verification badges (Pending, Approved, Rejected).
  * **Full In-App Document Viewer Modal:**
    * Native embedded PDF viewer iframe with print and download tools.
    * High-resolution image preview with interactive Zoom In, Zoom Out, Reset (100%), and Fullscreen pan.
    * Direct Approve / Reject compliance document actions.
* **Broadcasts & Platform Announcements:**
  * Create, publish, and schedule system-wide or role-targeted announcements.
  * Urgent alert banners with expiration dates.
* **Commission & Membership Oversight:**
  * Agency plan assignments (Basic, Pro, Enterprise) and commission rates.
* **Admin Profile & Security Center:**
  * Dedicated `/profile` and `/settings` workspace.
  * Profile details manager (name, admin email).
  * **Change Password Center:** Secure password updates directly from the admin interface.

---

## 4. Third-Party Integrations & Services

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Third-Party Integrations                        │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│ Service / Provider   │ Purpose              │ Integration Details      │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ Firebase FCM         │ Push Notifications   │ firebase-admin SDK       │
│ Google Translate     │ Real-time Chat i18n  │ @google-cloud/translate  │
│ Socket.io            │ Real-time Messaging  │ WebSockets / Polling     │
│ OpenWeather API      │ Live Destination Wx  │ REST API Integration     │
│ Google OAuth 2.0     │ Single Sign-On (SSO) │ Google Auth Client       │
│ SMTP / Nodemailer    │ Transactional Email  │ System Notifications     │
│ MySQL 8.0            │ Relational Storage   │ Sequelize ORM            │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

### 4.1. Firebase Cloud Messaging (FCM)
* **Library:** `firebase-admin` (v14.5.0)
* **Application:** Mobile & Web foreground and background push alerts.
* **Features:**
  * Alerts agencies instantly when a matching traveller request is posted.
  * Alerts travellers when a new quotation is submitted or message received.
  * Service worker implementation in frontends for persistent notifications.

### 4.2. Google Cloud Translation API
* **Library:** `@google-cloud/translate` (v10.3.0)
* **Application:** Automated translation for multilingual travel communications.
* **Features:**
  * Translates traveller inquiries (e.g., English) into Turkish for local agency representatives.
  * Translates agency responses back to the traveller's native language.
  * On-demand toggle to view original source text vs. translated content.

### 4.3. Socket.io Real-Time Communications
* **Library:** `socket.io` (v4.8.3) / `socket.io-client`
* **Application:** High-performance bi-directional event stream.
* **Features:**
  * Real-time chat messages between travellers and agencies.
  * Typing status indicators ("Agency is typing...").
  * Message read receipts and delivery statuses.
  * Real-time in-app notification badge increments without requiring page refreshes.

### 4.4. Weather Forecast Integration
* **Library:** Custom Axios HTTP adapter
* **Application:** Dynamic destination weather widgets.
* **Features:**
  * Displays 5-day weather forecasts for planned tour destinations.
  * Packing suggestions based on weather conditions (sunny, rain, cold).

### 4.5. Google OAuth 2.0 (SSO)
* **Library:** Google Sign-In SDK
* **Application:** Streamlined traveller onboarding.
* **Features:**
  * Passwordless signup and login for travellers.
  * Automatic profile picture and email synchronization.

### 4.6. Transactional Mailer (SMTP)
* **Application:** System emails and alerts.
* **Features:**
  * Registration email verification.
  * Agency approval and rejection decision notices.
  * Quotation received notifications.
  * Password change confirmation alerts.

---

## 5. UI/UX Excellence & Mobile Optimization

### 5.1. Glassmorphic Language Switcher
* Redesigned language selector implemented uniformly across Admin, Agency, and Traveller portals.
* Features an embedded SVG globe icon (`FiGlobe`), translucent pill container (`rgba(255, 255, 255, 0.12)`), smooth micro-interaction transitions, and high-contrast active state indicators.
* Localized strings managed through centralized `@troublefree/i18n` with full English (`en`) and Turkish (`tr`) coverage.

### 5.2. Mobile-First Responsive Engineering
* **Header Optimization:**
  * Elimination of dual desktop/mobile toggle buttons on mobile viewports.
  * Responsive scaling of brand logos and badges down to `26px` on handheld devices.
  * Profile trigger adapts automatically on screens `<= 768px`, collapsing name text and chevrons into a clean, circular avatar badge to prevent horizontal overflow.
  * Adaptive language switcher that hides the icon on small viewports (`< 540px`) to preserve spacing.
* **Tested Breakpoints:**
  * Desktop (1440px / 1200px)
  * Tablet (1024px / 768px)
  * Large Mobile (480px / 414px)
  * Small Mobile (375px / 360px)

---

## 6. Security & Data Protection Architecture

1. **Dual-Token Authentication:**
   * Short-lived JWT Access Tokens (15 minutes) stored strictly in client memory.
   * Long-lived Refresh Tokens stored in encrypted, HttpOnly, SameSite, Secure cookies.
   * Automatic background silent token refresh.
2. **Password Security Policy:**
   * Passwords hashed using bcrypt with salt rounds (factor 10+).
   * Minimum length enforcement (8+ characters) with client-side and server-side validation.
   * `POST /api/v1/auth/change-password` endpoint requiring current password re-authentication before committing changes.
3. **Defense-in-Depth Protections:**
   * **Helmet HTTP Headers:** XSS filtering, frameguard (clickjacking prevention), and strict transport security (HSTS).
   * **CORS Configuration:** Explicitly whitelisted frontend origins.
   * **Rate Limiting:** IP-based and user-based throttling on sensitive endpoints (`/auth/*`) to prevent brute-force attacks.
   * **SQL Injection Prevention:** 100% parameterized queries via Sequelize ORM.
   * **Global Session Revocation:** Ability to invalidate all active refresh tokens for an account upon security events.

---

## 7. Testing, Build & Quality Assurance

* **Backend Unit & Integration Tests:**
  * Comprehensive test suite in `backend/tests/` running on native `node:test`.
  * 41/41 auth, token, hashing, and validation tests passing with 0 failures.
* **Frontend Production Builds:**
  * All three applications (`@troublefree/admin-web`, `@troublefree/agency-web`, `@troublefree/traveller-web`) compile cleanly via `vite build` with zero syntax or bundling errors.
* **Code Consistency:**
  * Centralized ESLint and Prettier rules enforced across all workspaces.

---

## 8. Deployment & Environment Readiness

### Production Environment Variable Checklist

```bash
# Core Environment
NODE_ENV=production
PORT=5001

# Database (MySQL 8.0)
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=3306
DB_NAME=troublefree_db
DB_USER=troublefree_user
DB_PASSWORD=your_strong_db_password
DB_SSL_CA_PATH=/path/to/rds-ca-2019-root.pem

# Authentication Secrets (generate with `openssl rand -hex 64`)
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key

# Third-Party Integrations
FIREBASE_PROJECT_ID=quotemetrip-fcm
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@quotemetrip.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_TRANSLATE_API_KEY=your_google_cloud_api_key
WEATHER_API_KEY=your_openweather_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Mail Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM="QuoteMeTrip <noreply@quotemetrip.com>"
```

---

## 9. Conclusion

The **QuoteMeTrip** platform is fully operational, feature-complete according to specification, and validated for production deployment. The architecture provides scalability, robust data security, responsive mobile experiences, and third-party integrations tailored for high-volume travel quotation workflows.
