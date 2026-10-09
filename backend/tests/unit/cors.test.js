import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isAllowedOrigin, corsOptions } from '../../src/config/cors.js';

describe('CORS configuration', () => {
  it('allows non-browser requests without origin header', (t, done) => {
    corsOptions.origin(undefined, (err, allow) => {
      assert.strictEqual(err, null);
      assert.strictEqual(allow, true);
      done();
    });
  });

  it('allows standard localhost and 127.0.0.1 origins on arbitrary ports', () => {
    assert.strictEqual(isAllowedOrigin('http://localhost:5173'), true);
    assert.strictEqual(isAllowedOrigin('http://localhost:5174'), true);
    assert.strictEqual(isAllowedOrigin('http://localhost:5175'), true);
    assert.strictEqual(isAllowedOrigin('http://localhost:3000'), true);
    assert.strictEqual(isAllowedOrigin('http://127.0.0.1:5173'), true);
    assert.strictEqual(isAllowedOrigin('http://127.0.0.1:8080'), true);
  });

  it('allows Vercel production and preview domains', () => {
    assert.strictEqual(isAllowedOrigin('https://quote-me-trip-omega.vercel.app'), true);
    assert.strictEqual(isAllowedOrigin('https://quotemetrip-traveller.vercel.app'), true);
    assert.strictEqual(isAllowedOrigin('https://quotemetrip-agency.vercel.app'), true);
    assert.strictEqual(isAllowedOrigin('https://preview-branch-123.vercel.app'), true);
  });

  it('allows Render and QuoteMeTrip production domains', () => {
    assert.strictEqual(isAllowedOrigin('https://quotemetrip.onrender.com'), true);
    assert.strictEqual(isAllowedOrigin('https://quotemetrip.com'), true);
    assert.strictEqual(isAllowedOrigin('https://www.quotemetrip.com'), true);
  });

  it('corsOptions passes allowed origin to callback', (t, done) => {
    corsOptions.origin('https://quote-me-trip-omega.vercel.app', (err, allow) => {
      assert.strictEqual(err, null);
      assert.strictEqual(allow, true);
      done();
    });
  });
});
