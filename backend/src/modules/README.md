# Modules

Business modules (traveller, agency, admin, travel-request, quotation,
messaging, membership, notification, rating, etc.) will live here as
self-contained folders, each following the pattern:

```
modules/<name>/
├── <name>.routes.js
├── <name>.controller.js
├── <name>.service.js
└── <name>.repository.js
```

No modules are implemented in Phase 1 — this directory exists to
establish the intended location for future business logic.
