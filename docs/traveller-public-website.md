# Traveller Public Website Architecture (Track B — V1)

## Overview

The public-facing Traveller website for **QuoteMeTrip** provides a modern, consumer-focused travel discovery and route planning entry point while seamlessly preserving the existing authenticated Traveller portal.

---

## 1. Public Routes

The following public routes are defined within `web/apps/traveller/src/App.jsx` under `PublicLayout`:

| Route                 | View Component          | Description                                                                                                                     |
| :-------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `/`                   | `PublicHomePage`        | Public homepage featuring Hero banner, Popular Destinations, How It Works, Why Us, Travel Guide, Agency Preview, and Final CTA. |
| `/destinations`       | `DestinationsPage`      | Searchable and filterable grid of travel destinations across Turkey's key regions.                                              |
| `/destinations/:slug` | `DestinationDetailPage` | Detailed view for a destination including highlights, travel info, related guides, and "Plan a Trip" CTA.                       |
| `/travel-guide`       | `TravelGuidePage`       | Searchable article index for travel advice, itineraries, and tips.                                                              |
| `/travel-guide/:slug` | `TravelGuideDetailPage` | Full article reading page with metadata, cover image, related articles, and CTA.                                                |
| `/agencies`           | `AgenciesPage`          | Searchable public agency directory displaying public-safe agency profiles.                                                      |
| `/agencies/:id`       | `AgencyDetailPage`      | Detailed public profile of a verified travel agency. Excludes private contact details.                                          |
| `/about`              | `AboutPage`             | Platform overview, route-first planning methodology, and agency matching benefits.                                              |
| `/contact`            | `ContactPage`           | Customer support contact form with client validation, submission state, and error handling.                                     |
| `/login`              | `LoginPage`             | Public authentication entry with `?redirect=...` query support.                                                                 |
| `/register`           | `RegisterPage`          | Public registration entry with `?redirect=...` query support.                                                                   |

---

## 2. Layout Structure & Routing Architecture

- `PublicLayout`: Wraps public pages with `PublicHeader`, `<main className="tf-public-main">`, and `PublicFooter`.
- `PublicHeader`: Responsive navbar featuring desktop links, language switcher (`EN | TR`), Plan My Trip CTA, and keyboard-accessible mobile drawer menu.
- `PublicFooter`: Footer with brand tagline, navigation links, company links, language selector, and copyright statement.
- **Portal Separation**: Authenticated portal routes remain available under `/app/...` (e.g. `/app/plan-trip`, `/app/travel-requests`, `/app/messages`, `/app/jobs`, `/app/profile`) as well as existing direct routes (`/plan-trip`, `/messages`, `/jobs`), ensuring complete backward compatibility for tests and deep links.

---

## 3. Design Tokens & Visual Identity

Built using the project-wide **Light Green + Yellow** design system defined in `@troublefree/ui`:

- **Primary Color**: `#2E9E5B` (`--tf-primary`), Dark Green `#237A46` (`--tf-primary-dark`), Light Green `#E4F4EA` (`--tf-primary-light`)
- **Secondary Accent**: `#F5C518` (`--tf-secondary`), Dark Yellow `#C99E0A` (`--tf-secondary-dark`)
- **Surfaces**: Light Gray Background `#F4F6F4` (`--tf-background`), Card Surface `#FFFFFF` (`--tf-surface`), Border `#DCE3DC` (`--tf-border`)
- **Text**: Dark Charcoal `#23272B` (`--tf-text`), Muted Text `#5B6570` (`--tf-text-muted`)

---

## 4. Public Component Architecture

Shared public components are exported from `@troublefree/ui`:

- `PublicHeader`: Responsive header with desktop/mobile navigation and user actions.
- `PublicFooter`: Responsive footer.
- `LanguageSwitcher`: Accessible `EN | TR` language toggle.
- `DestinationCard`: Card component for destination previews.
- `GuideCard`: Card component for travel articles.
- `AgencyCard`: Card component for public agency profiles.
- `SectionHeading`: Reusable section header with subtitle and Light Green/Yellow accent.
- `CTASection`: Conversion section banner with Light Green background and Yellow CTA.

---

## 5. API Data Sources & Mock Boundaries

- **Service Layer**: `web/apps/traveller/src/services/public-api.js` provides centralized query functions (`getDestinations`, `getDestinationBySlug`, `getTravelGuides`, `getTravelGuideBySlug`, `getAgencies`, `getAgencyById`, `submitContactForm`).
- **Data Boundary**: Isolated controlled dataset in `web/apps/traveller/src/data/public-data.js` containing rich destinations, travel guides, and public agency profiles.
- **CMS Ready**: Prepared for drop-in replacement when backend CMS endpoints are added.

---

## 6. Contact Protection & Public Privacy

- Public agency views (`/agencies`, `/agencies/:id`) expose only public metadata: `agencyName`, `city`, `country`, `bio`, `specialties`, `languages`, and `verified` badge.
- Private contact details (`businessEmail`, `phone`, `contactPerson`, `WhatsApp`) are **strictly excluded** from public serializers and frontend public views.
- Unmasked contact details are only revealed post-acceptance of a quotation.

---

## 7. Internationalization (i18n)

- `@troublefree/i18n` provides translation dictionaries for English (`en`) and Turkish (`tr`).
- `I18nProvider` context exposes `locale`, `setLocale`, and `t(key, fallback)`.
- Persists user language preference in `localStorage` (`tf_locale`).

---

## 8. Authentication Redirect Flow

1. Unauthenticated visitor clicks **"Plan My Trip"** anywhere on the public website.
2. Visitor is navigated to `/login?redirect=/plan-trip`.
3. Upon successful login or registration, the application redirects the user directly to `/plan-trip`.
4. The authenticated route planner loads and the user continues their trip creation seamlessly.
