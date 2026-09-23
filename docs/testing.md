# Testing

## Phase 1 scope

A test directory structure exists at `backend/tests/` with `unit/`,
`integration/`, and `e2e/` subfolders. A single smoke test validates
the health endpoint (`backend/tests/unit/health.test.js`) using
Node's built-in test runner.

No test runner is wired into `package.json` scripts yet, and no
business-logic test suites exist, since no business logic exists in
Phase 1.

## Running the smoke test manually

```bash
node --test backend/tests/unit/health.test.js
```
