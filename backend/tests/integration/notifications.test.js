import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';

import app from '../../src/app.js';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { notificationService } from '../../src/modules/notifications/notification.service.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from '../../src/modules/notifications/notification.constants.js';

const suffix = Date.now().toString(36);
let emailCounter = 0;
const email = (name) => `${name}+${suffix}-${emailCounter++}@example.com`;

let db;
let models;
let server;
let baseUrl;

async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

describe('Notification system integration tests', () => {
  before(async () => {
    resetSequelizeInstance();
    db = getSequelize();
    await db.authenticate();
    models = initModels(db);

    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  });

  test('GET /api/v1/notifications?unreadOnly=true&pageSize=1 returns 200 OK and correct counts', async () => {
    // 1. Register a test user
    const address = email('notify-test');
    const regRes = await api('POST', '/api/v1/auth/register/traveller', {
      body: {
        name: 'Notification Tester',
        email: address,
        password: 'password-123',
        firstName: 'Notify',
        lastName: 'Tester',
      },
    });
    assert.strictEqual(regRes.status, 201);
    const token = regRes.json.data.accessToken;
    const userId = regRes.json.data.user.id;

    // 2. Query empty notifications with unreadOnly and pageSize
    const emptyRes = await api('GET', '/api/v1/notifications?unreadOnly=true&pageSize=1', { token });
    assert.strictEqual(emptyRes.status, 200);
    assert.ok(Array.isArray(emptyRes.json.data));
    assert.strictEqual(emptyRes.json.data.length, 0);

    // 3. Create two in-app notifications
    const n1 = await notificationService.notify(
      userId,
      NOTIFICATION_EVENTS.AGENCY_MATCHED,
      NOTIFICATION_CHANNELS.IN_APP,
      'New Request Matched',
      'A new travel request was matched to your account.',
      { travelRequestId: 101 },
    );
    const n2 = await notificationService.notify(
      userId,
      NOTIFICATION_EVENTS.QUOTATION_SUBMITTED,
      NOTIFICATION_CHANNELS.IN_APP,
      'New Quote Received',
      'An agency submitted a quotation for your trip.',
      { quotationId: 202 },
    );

    // 4. Verify unread count endpoint
    const unreadCountRes = await api('GET', '/api/v1/notifications/unread-count', { token });
    assert.strictEqual(unreadCountRes.status, 200);
    assert.strictEqual(unreadCountRes.json.data.count >= 2, true);

    // 5. Query notifications with unreadOnly=true & pageSize=1 (The reported bug endpoint!)
    const pagedRes = await api('GET', '/api/v1/notifications?unreadOnly=true&pageSize=1', { token });
    assert.strictEqual(pagedRes.status, 200);
    assert.strictEqual(pagedRes.json.status, 'success');
    assert.ok(Array.isArray(pagedRes.json.data));
    assert.strictEqual(pagedRes.json.data.length, 1);
    assert.strictEqual(pagedRes.json.pagination.limit, 1);
    assert.strictEqual(pagedRes.json.pagination.totalItems >= 2, true);

    // 6. Mark one notification as read
    const markReadRes = await api('PATCH', `/api/v1/notifications/${n1.id}/read`, { token });
    assert.strictEqual(markReadRes.status, 200);

    // 7. Verify unread count decremented
    const afterReadCountRes = await api('GET', '/api/v1/notifications/unread-count', { token });
    assert.strictEqual(afterReadCountRes.status, 200);
    assert.strictEqual(afterReadCountRes.json.data.count, unreadCountRes.json.data.count - 1);
  });
});
