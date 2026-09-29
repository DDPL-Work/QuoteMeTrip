# Permissions

## Status

Role-based access control implemented in **Phase 3**.

## Roles

Exactly three roles (shared `users.role` enum and auth layer):

```text
traveller   Traveller portal
agency      Agency portal
admin       Admin portal
```

No other roles exist in this phase.

## Backend enforcement

`authenticate` verifies the Bearer access token and attaches
`req.user = { id, role, tokenId }`. `authorize(...roles)` runs after
it and returns `403 AUTH_FORBIDDEN` on role mismatch, `401` when
unauthenticated:

```js
router.get('/admin/…', authenticate, authorize('admin'), handler);
router.get('/portal/…', authenticate, authorize('traveller', 'agency'), handler);
```

## Semantics

- `401` — no/invalid/expired authentication (frontend → login).
- `403` — authenticated but insufficient role (frontend → inline
  "Access denied", stays signed in).
- Frontend guards (`RequireAuth` / `RequireRole`) are UX only.

## Account status

`active` → allowed. `inactive` / `suspended` → login and refresh
rejected (`AUTH_ACCOUNT_INACTIVE` / `AUTH_ACCOUNT_SUSPENDED`).

## Future

Business permissions (agency sub-users, granular scopes) arrive with
later modules. The `authorize()` signature already accepts multiple
roles and throws on unknown roles at wiring time.
