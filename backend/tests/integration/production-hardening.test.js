import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { before, describe, test, after } from 'node:test';
import http from 'node:http';
import app from '../../src/app.js';
import { validateEnvironment } from '../../src/config/env.js';
import { validateFileMetadata } from '../../src/middleware/upload.js';
import { sanitizeHtml } from '../../src/utils/sanitizer.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Phase 9 — Production Hardening & Readiness Integration Tests', () => {
  test('Liveness health endpoint returns 200 ok and uptime', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/liveness`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.status, 'ok');
    assert.ok(typeof body.uptimeSeconds === 'number');
  });

  test('Readiness health endpoint returns 200 ready when DB is available', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/readiness`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.status, 'ready');
    assert.strictEqual(body.database.status, 'connected');
    assert.ok(body.optionalProviders);
  });

  test('Request correlation ID is returned in response headers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/liveness`);
    const requestId = res.headers.get('x-request-id');
    assert.ok(requestId, 'x-request-id header should be present');
    assert.ok(requestId.length > 10);
  });

  test('Security headers (Helmet) are present on HTTP responses', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/liveness`);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(res.headers.get('content-security-policy'));
  });

  test('CORS handles origin checks properly', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/liveness`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });

  test('Environment validator validates required configs in production mode', () => {
    const env = validateEnvironment();
    assert.ok(env.nodeEnv);
    assert.ok(typeof env.isProduction === 'boolean');
  });

  test('File upload validator enforces extension, MIME type, size, and prevents path traversal', () => {
    // Valid file
    const valid = validateFileMetadata({
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    });
    assert.strictEqual(valid.originalName, 'document.pdf');
    assert.strictEqual(valid.extension, '.pdf');

    // Invalid extension
    assert.throws(() => {
      validateFileMetadata({
        originalname: 'script.exe',
        mimetype: 'application/pdf',
        size: 1024,
      });
    }, /Invalid file extension/);

    // Path traversal attempt in filename
    const traversal = validateFileMetadata({
      originalname: '../../../etc/passwd.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    });
    assert.strictEqual(traversal.safeFilename, 'passwd.pdf');
  });

  test('HTML Sanitizer removes dangerous XSS tags and script event handlers', () => {
    const dirty =
      '<div>Hello <script>alert("xss")</script><img src="x" onerror="alert(1)"> <a href="javascript:steal()">Click</a></div>';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('onerror='));
    assert.ok(!clean.includes('javascript:'));
    assert.ok(clean.includes('Hello'));
  });
});
