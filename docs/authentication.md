# Authentication

## Status

Implemented in **Phase 3 — Authentication, Identity & RBAC**.

## Model

Short-lived JWT **access token** + server-side **refresh session**:

```text
Access token (Authorization: Bearer …)
  - 15 minutes (JWT_ACCESS_EXPIRES_IN)
  - payload: { sub, role, type: 'access', jti, iat, exp }
  - kept in React in-memory state only (never localStorage)

Refresh session (HttpOnly cookie `tfh_refresh`)
  - 7 days (JWT_REFRESH_EXPIRES_IN), path /api/v1/auth
  - stored as SHA-256 hash in `auth_sessions` — never the raw token
  - rotated on every use, revocable, family-tracked for reuse detection
```

## Endpoints

| Method | Path                              | Auth   | Notes                                   |
| ------ | --------------------------------- | ------ | --------------------------------------- |
| POST   | `/api/v1/auth/register/traveller` | no     | Creates `users` + `traveller_profiles`  |
| POST   | `/api/v1/auth/register/agency`    | no     | Creates `users` + `agency_profiles`     |
| POST   | `/api/v1/auth/login`              | no     | Email + password, rate limited          |
| POST   | `/api/v1/auth/google`             | no     | Traveller only, token verified remotely |
| POST   | `/api/v1/auth/refresh`            | cookie | Rotates the refresh session             |
| POST   | `/api/v1/auth/logout`             | cookie | Revokes current session                 |
| POST   | `/api/v1/auth/logout-all`         | yes    | Revokes all user sessions               |
| GET    | `/api/v1/auth/me`                 | yes    | Sanitized identity + profile            |

There is **no public admin registration**. Admins are provisioned via:

```bash
ADMIN_EMAIL=ops@example.com ADMIN_NAME=Ops ADMIN_PASSWORD=… \
  npm run admin:create --workspace=@troublefree/backend
```

## Product rules

- Traveller: email/password **and** Google login.
- Agency: corporate/agency email + password. Google login rejected
  server-side (`AUTH_GOOGLE_LOGIN_NOT_ALLOWED`).
- Admin: dedicated admin portal login only.
- No SMS OTP anywhere in the auth flow.
- Login failures always return `Invalid email or password.`
  (`AUTH_INVALID_CREDENTIALS`) — no user enumeration.

## Frontend

- Shared behavior in `@troublefree/api-client`: credentials, auth
  header, single-flight 401 → refresh → retry-once, session-loss
  notification. The refresh request itself never retries (no loops).
- Each app owns an `AuthProvider` (user/isLoading), `RequireAuth` /
  `RequireRole` guards, and `/login` (+ `/register` for Traveller and
  Agency). Boot sequence: refresh → me → render (no redirect flicker).
- 401 → login. 403 → inline "Access denied" (wrong portal, stays
  signed in). Guards are UX; the backend enforces every rule.

## Google login status

Backend endpoint + Traveller UI are implemented and tested with a
stubbed provider verifier. **Live Google login is NOT configured**
(`GOOGLE_CLIENT_ID` empty) — the endpoint honestly returns
`503 AUTH_GOOGLE_NOT_CONFIGURED` until credentials are provisioned.
Set `VITE_GOOGLE_CLIENT_ID` (Traveller) and `GOOGLE_CLIENT_ID`
(backend) to enable it.

## Security principles

See `docs/security.md`.
