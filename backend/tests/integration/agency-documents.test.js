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

describe('Agency documents integration tests', () => {
  before(async () => {
    resetSequelizeInstance();
    db = getSequelize();
    await db.authenticate();
    initModels(db);

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

  test('POST /api/v1/agency/documents with base64 data URL and GET list without order clause error', async () => {
    // 1. Register test agency
    const agencyEmail = email('agency-doc-test');
    const regRes = await api('POST', '/api/v1/auth/register/agency', {
      body: {
        name: 'Agency Document Tester',
        email: agencyEmail,
        password: 'password-123',
        agencyName: 'Doc Test Agency',
        contactPerson: 'Doc Tester',
        phone: '+1234567890',
      },
    });
    assert.strictEqual(regRes.status, 201, `Failed to register agency: ${JSON.stringify(regRes.json)}`);
    const token = regRes.json.data.accessToken;

    // 2. Initial GET /api/v1/agency/documents should return empty array and 200 OK
    const initialGetRes = await api('GET', '/api/v1/agency/documents', { token });
    assert.strictEqual(initialGetRes.status, 200, `Initial GET failed: ${JSON.stringify(initialGetRes.json)}`);
    assert.deepStrictEqual(initialGetRes.json.data, []);

    // 3. Upload document using base64 data URL (same as frontend AgencyOnboardingWizard)
    // Minimal valid 1x1 png as base64 data URL
    const samplePngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const uploadRes = await api('POST', '/api/v1/agency/documents', {
      token,
      body: {
        documentType: 'license',
        filePath: samplePngDataUrl,
        originalName: 'test_license.png',
        mimeType: 'image/png',
        size: 68,
      },
    });

    assert.strictEqual(uploadRes.status, 201, `Upload failed: ${JSON.stringify(uploadRes.json)}`);
    assert.strictEqual(uploadRes.json.success, true);
    assert.ok(uploadRes.json.data.id, 'Document ID should be present');
    assert.strictEqual(uploadRes.json.data.documentType, 'license');
    assert.ok(
      uploadRes.json.data.filePath.startsWith('/uploads/'),
      `filePath should start with /uploads/, got ${uploadRes.json.data.filePath}`,
    );
    assert.strictEqual(uploadRes.json.data.status, 'pending');

    const uploadedDocId = uploadRes.json.data.id;

    // 4. GET /api/v1/agency/documents should list the uploaded document ordered by created_at DESC
    const listRes = await api('GET', '/api/v1/agency/documents', { token });
    assert.strictEqual(listRes.status, 200, `List GET failed: ${JSON.stringify(listRes.json)}`);
    assert.strictEqual(listRes.json.success, true);
    assert.strictEqual(listRes.json.data.length, 1);
    assert.strictEqual(listRes.json.data[0].id, uploadedDocId);
    assert.strictEqual(listRes.json.data[0].documentType, 'license');
    assert.strictEqual(listRes.json.data[0].originalName, 'test_license.png');
    assert.ok(listRes.json.data[0].filePath.startsWith('/uploads/'));

    // 5. Delete document
    const delRes = await api('DELETE', `/api/v1/agency/documents/${uploadedDocId}`, { token });
    assert.strictEqual(delRes.status, 200, `Delete failed: ${JSON.stringify(delRes.json)}`);

    // 6. Verify empty list after deletion
    const finalGetRes = await api('GET', '/api/v1/agency/documents', { token });
    assert.strictEqual(finalGetRes.status, 200);
    assert.deepStrictEqual(finalGetRes.json.data, []);
  });
});
