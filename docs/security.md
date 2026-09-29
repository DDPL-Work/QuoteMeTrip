# Security — Authentication (Phase 3)

Principles enforced by implementation and tests (not just policy):

## Password storage

- `bcrypt` with configurable cost (`AUTH_BCRYPT_ROUNDS`, default 12).
- Plain-text passwords never reach the database, logs, responses,
  JWTs, or error messages. Backend integration tests assert the
  session store holds only hashes.

## Tokens

- Access tokens are short-lived (15m), minimal-claim (`sub`, `role`,
  `type`, `jti`), and type-checked on verification — a refresh token
  is never accepted as an access token and vice versa.
- Refresh tokens live only in an `HttpOnly` cookie (`Secure` in
  production, `SameSite=lax`, scoped to `/api/v1/auth`). They are
  never returned in JSON bodies and never written to
  `localStorage`/`sessionStorage` (enforced in code + frontend tests).
- Rotation on every refresh; replay of a rotated token revokes the
  whole token family (`AUTH_REFRESH_REUSED`) and forces
  re-authentication. Logout revokes server-side — not just cookie
  deletion.

## Attack mitigations

| Threat                | Mitigation                                             |
| --------------------- | ------------------------------------------------------ |
| Credential stuffing   | Rate limits on login/Google/refresh (configurable)     |
| User enumeration      | Generic `Invalid email or password.` for all failures  |
| Token theft           | Short access life, rotation, reuse detection, HttpOnly |
| Privilege escalation  | Backend `authorize()` is final; frontend never trusted |
| CSRF (cookie refresh) | `SameSite=lax`, narrow cookie path, short access life  |
| Agency social bypass  | Enforced by role check in the auth service, not the UI |

## Logging

Auth events emit structured `AUTH_*` logs (login success/failure,
refresh, reuse detected, logout) with safe metadata only
(`userId`, `role`, `ip`, timestamp). Secrets and tokens are never
logged — the logger defensively strips secret-like fields.

## Secrets

- JWT secrets come from the environment; the backend refuses to sign
  without them. No default/placeholder secrets ship in code.
- Test-only secrets are injected by the test suites/CI and are
  clearly labeled `…-not-for-production`.
- Vite apps receive only public config (`VITE_API_URL`,
  `VITE_GOOGLE_CLIENT_ID`). No secret is ever exposed to the bundle.

## Out of scope (later phases)

Email verification workflow, password reset/change UI, persistent
audit table (events are structured logs ready to be consumed).
