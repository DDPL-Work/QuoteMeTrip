/**
 * Minimal smoke test for Phase 1.
 *
 * No test runner is wired into package.json yet (Phase 1 does not
 * require a full test suite). This file documents the expected
 * behavior and can be run with any Node-compatible test runner
 * once one is chosen, e.g.:
 *
 *   node --test backend/tests/unit/health.test.js
 */
import 'dotenv/config';
import assert from 'node:assert';
import { test, after } from 'node:test';
import request from 'node:http';
import app from '../../src/app.js';
import { closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';

// The health endpoint probes the database (Phase 2), which opens the
// connection pool. Release it so the test process can exit cleanly.
after(async () => {
  await closeDatabase();
  resetSequelizeInstance();
});

test('GET /api/v1/health returns a healthy JSON payload', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const body = await new Promise((resolve, reject) => {
      request
        .get(`http://127.0.0.1:${port}/api/v1/health`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
        })
        .on('error', reject);
    });

    assert.strictEqual(body.status, 200);
    assert.strictEqual(body.json.success, true);
    assert.strictEqual(body.json.status, 'healthy');
    assert.strictEqual(body.json.database.status, 'connected');
  } finally {
    server.close();
  }
});
