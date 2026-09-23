# Deployment

## Status

Phase 1 covers local development only. Production deployment
strategy is not defined yet.

## Local development ports

| Service       | Port |
| ------------- | ---- |
| Backend       | 5000 |
| Traveller web | 5173 |
| Agency web    | 5174 |
| Admin web     | 5175 |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs install, lint,
format check, and build on every push/PR. It does not deploy.
