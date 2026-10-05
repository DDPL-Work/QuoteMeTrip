import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';

import app from '../../src/app.js';
import { getSequelize, closeDatabase, resetSequelizeInstance } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';

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

describe('Traveller profile media integration tests', () => {
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

  test('upload profile picture and cover image, persist in DB and retrieve on profile GET', async () => {
    // 1. Register a test traveller
    const address = email('media-traveller');
    const regRes = await api('POST', '/api/v1/auth/register/traveller', {
      body: {
        name: 'Media Traveller',
        email: address,
        password: 'password-123',
        firstName: 'Media',
        lastName: 'Tester',
      },
    });
    assert.strictEqual(regRes.status, 201);
    const token = regRes.json.data.accessToken;

    // Small 1x1 transparent png in base64
    const samplePngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    // 2. Upload profile picture
    const picRes = await api('POST', '/api/v1/travellers/me/profile-picture', {
      token,
      body: {
        image: samplePngBase64,
        filename: 'my_avatar.png',
      },
    });
    assert.strictEqual(picRes.status, 200);
    assert.ok(picRes.json.data.url.startsWith('/uploads/'));
    assert.strictEqual(picRes.json.data.profile.profilePicture, picRes.json.data.url);

    // 3. Upload cover image
    const coverRes = await api('POST', '/api/v1/travellers/me/cover-image', {
      token,
      body: {
        image: samplePngBase64,
        filename: 'my_cover.png',
      },
    });
    assert.strictEqual(coverRes.status, 200);
    assert.ok(coverRes.json.data.url.startsWith('/uploads/'));
    assert.strictEqual(coverRes.json.data.profile.coverImage, coverRes.json.data.url);

    // 4. Fetch profile and verify persistent media fields
    const getRes = await api('GET', '/api/v1/travellers/me', { token });
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.json.data.profile.profilePicture, picRes.json.data.url);
    assert.strictEqual(getRes.json.data.profile.coverImage, coverRes.json.data.url);
    assert.strictEqual(getRes.json.data.profile.avatarUrl, picRes.json.data.url);

    // 5. Test static file serving of the uploaded file
    const staticRes = await fetch(`${baseUrl}${picRes.json.data.url}`);
    assert.strictEqual(staticRes.status, 200);
    assert.strictEqual(staticRes.headers.get('content-type'), 'image/png');
  });
});
