# Integrations

## Principle

All third-party providers are isolated behind adapters under
`backend/src/integrations/`. Business logic never depends on a
specific provider SDK directly.

## Reserved integration points

```text
integrations/
├── maps/         — route/distance/geometry provider (abstraction only in Phase 1)
├── weather/      — reserved
├── email/        — reserved
├── sms/          — reserved
├── firebase/     — reserved (push notifications)
├── payments/     — reserved
├── esignature/   — reserved
└── ai/           — reserved
```

No concrete provider is selected or implemented in Phase 1.
