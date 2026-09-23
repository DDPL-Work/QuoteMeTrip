# Troublefree Holiday

Travel marketplace and quotation platform connecting **Travellers**,
**Agencies**, and **Admins**.

> **Phase 1 — Project Foundation.** This repository currently contains
> the engineering foundation only: no database, authentication, or
> business logic is implemented yet. See [Phase structure](#phase-structure).

## Applications

| App           | Path                  | Port |
| ------------- | --------------------- | ---- |
| Backend API   | `backend/`            | 5000 |
| Traveller web | `web/apps/traveller/` | 5173 |
| Agency web    | `web/apps/agency/`    | 5174 |
| Admin web     | `web/apps/admin/`     | 5175 |

## Technology stack

- **Backend:** Node.js, Express.js, ES Modules
- **Frontend:** React.js, Vite
- **Database (Phase 2+):** MySQL, Sequelize
- **Package manager:** npm (workspaces)
- **Code quality:** ESLint, Prettier, EditorConfig
- **CI:** GitHub Actions

## Repository structure

```text
troublefree-holiday/
├── .github/workflows/ci.yml
├── backend/                  # Express API (modular monolith)
├── web/
│   ├── apps/
│   │   ├── traveller/        # Traveller React app
│   │   ├── agency/           # Agency React app
│   │   └── admin/            # Admin React app
│   └── packages/
│       ├── ui/               # @troublefree/ui
│       ├── api-client/       # @troublefree/api-client
│       ├── types/             # @troublefree/types
│       ├── i18n/              # @troublefree/i18n
│       └── config/            # @troublefree/config
├── docs/                      # Architecture & workflow documentation
├── package.json               # npm workspaces root
└── README.md
```

## Prerequisites

- Node.js **24** (see `.nvmrc` / `.node-version`)
- npm (bundled with Node)

## Environment setup

Copy each `.env.example` to `.env` and adjust as needed:

```bash
cp backend/.env.example backend/.env
cp web/apps/traveller/.env.example web/apps/traveller/.env
cp web/apps/agency/.env.example web/apps/agency/.env
cp web/apps/admin/.env.example web/apps/admin/.env
```

Never commit `.env` files. Variables prefixed `VITE_` are public
frontend configuration — never place secrets there.

## Installation

```bash
npm install
```

## Development commands

Run each application in its own terminal:

```bash
npm run dev --workspace=@troublefree/backend
npm run dev --workspace=@troublefree/traveller-web
npm run dev --workspace=@troublefree/agency-web
npm run dev --workspace=@troublefree/admin-web
```

Then verify:

- `http://localhost:5000/api/v1/health`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

## Linting

```bash
npm run lint
```

## Formatting

```bash
npm run format        # write
npm run format:check  # verify only
```

## Building

```bash
npm run build
```

## Git workflow

Branches:

```text
main        — stable / releasable
develop     — integration branch
feature/*   — new work, branched from and merged into develop
bugfix/*    — fixes, branched from and merged into develop
```

`develop` is merged into `main` for releases. Do not commit directly
to `main`.

## Phase structure

- ✅ **Phase 1 — Project Foundation** (this repository): monorepo,
  workspaces, backend skeleton, three React apps, shared packages,
  code quality tooling, CI.
- ⏭ **Phase 2 — MySQL + Sequelize Database Foundation**: database
  connection, models, associations, migrations, seeders.
- Later phases: authentication, route planning, travel requests,
  agency matching, quotations, messaging, membership, notifications,
  weather, travel guide, ratings, and the Pro-tier scope (mobile
  apps, payments, digital contracts, e-signature, BI, AI).

No feature beyond Phase 1 is implemented in this repository yet.
