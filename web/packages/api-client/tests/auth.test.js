/**
 * @troublefree/api-client tests (Phase 3).
 *
 * Covers the centralized auth behavior without a browser or backend:
 * Authorization injection, 401 -> single-flight refresh -> single
 * retry, refresh-failure session loss (no infinite loops), and error
 * normalization. Run with: npm run test --workspace=@troublefree/api-client
 */
import assert from 'node:assert';
import { describe, test } from 'node:test';
import axios from 'axios';

import { createApiClient, createAuthApi, toApiError } from '../src/index.js';

function ok(data) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function httpError(status, data) {
  return { data, status, statusText: 'Error', headers: {}, config: {} };
}

/**
 * Build a client over a scripted stub adapter.
 * `script` maps "METHOD path" -> handler(callCount) returning an
 * axios-style response object. Every request is recorded in `calls`.
 */
function stubClient(script, { onUnauthorized } = {}) {
  const calls = [];
  const counts = {};
  const transport = axios.create({
    adapter: async (config) => {
      const url = new URL(config.url, 'http://stub');
      const key = `${String(config.method || 'get').toUpperCase()} ${url.pathname}`;
      calls.push({ key, headers: { ...(config.headers || {}) } });
      counts[key] = (counts[key] || 0) + 1;
      const handler = script[key];
      if (!handler) throw new Error(`Unexpected request: ${key}`);
      const response = await handler(counts[key], config);
      response.config = config;
      // Mirror axios settle(): non-2xx becomes a rejection with `response`.
      if (response.status >= 200 && response.status < 300) return response;
      const error = new Error(`Request failed with status code ${response.status}`);
      error.config = config;
      error.response = response;
      throw error;
    },
  });
  const client = createApiClient({
    baseURL: 'http://stub',
    onUnauthorized,
    transport,
  });
  return { client, calls, counts };
}

describe('authorization header', () => {
  test('attaches the in-memory access token and clears on demand', async () => {
    const { client, calls } = stubClient({
      'GET /api/v1/auth/me': () => ok({ data: { user: { id: 1 } } }),
    });
    client.setAccessToken('token-abc');
    await client.http.get('/api/v1/auth/me');
    assert.strictEqual(calls[0].headers.Authorization, 'Bearer token-abc');

    client.clearAccessToken();
    await client.http.get('/api/v1/auth/me');
    assert.strictEqual(calls[1].headers.Authorization, undefined);
  });

  test('requires a baseURL', () => {
    assert.throws(() => createApiClient({}), /baseURL/);
  });
});

describe('401 refresh and retry', () => {
  test('refreshes once and retries the original request', async () => {
    const { client, counts } = stubClient({
      'GET /api/v1/profile': (n) =>
        n === 1
          ? httpError(401, {
              success: false,
              error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Expired.' },
            })
          : ok({ success: true }),
      'POST /api/v1/auth/refresh': () => ok({ data: { accessToken: 'fresh-token' } }),
    });

    const response = await client.http.get('/api/v1/profile');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(client.getAccessToken(), 'fresh-token');
    assert.strictEqual(counts['POST /api/v1/auth/refresh'], 1);
    assert.strictEqual(counts['GET /api/v1/profile'], 2);
  });

  test('concurrent 401s share a single refresh request', async () => {
    const { client, counts } = stubClient({
      'GET /api/v1/profile': (n) => (n <= 3 ? httpError(401, {}) : ok({ success: true })),
      'POST /api/v1/auth/refresh': async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return ok({ data: { accessToken: 'shared-token' } });
      },
    });

    const results = await Promise.all([
      client.http.get('/api/v1/profile'),
      client.http.get('/api/v1/profile'),
      client.http.get('/api/v1/profile'),
    ]);
    assert.ok(results.every((response) => response.status === 200));
    assert.strictEqual(counts['POST /api/v1/auth/refresh'], 1);
  });

  test('failed refresh clears state, notifies once, and never loops', async () => {
    let notifications = 0;
    const { client, counts } = stubClient(
      {
        'GET /api/v1/profile': () => httpError(401, {}),
        'POST /api/v1/auth/refresh': () => httpError(401, {}),
      },
      {
        onUnauthorized: () => {
          notifications += 1;
        },
      },
    );
    client.setAccessToken('stale-token');

    await assert.rejects(client.http.get('/api/v1/profile'));
    assert.strictEqual(client.getAccessToken(), null);
    assert.strictEqual(notifications, 1);
    assert.strictEqual(counts['POST /api/v1/auth/refresh'], 1);
    assert.strictEqual(counts['GET /api/v1/profile'], 1);
  });

  test('direct refresh failure also reports session loss', async () => {
    let notifications = 0;
    const { client } = stubClient(
      { 'POST /api/v1/auth/refresh': () => httpError(401, {}) },
      {
        onUnauthorized: () => {
          notifications += 1;
        },
      },
    );
    await assert.rejects(client.refreshAccessToken());
    assert.strictEqual(notifications, 1);
  });
});

describe('auth resource API', () => {
  test('me unwraps the backend envelope', async () => {
    const { client } = stubClient({
      'GET /api/v1/auth/me': () => ok({ success: true, data: { user: { id: 7 } } }),
    });
    const api = createAuthApi(client);
    assert.deepStrictEqual(await api.me(), { user: { id: 7 } });
  });

  test('failures normalize to code + status', async () => {
    const { client } = stubClient({
      'POST /api/v1/auth/login': () =>
        httpError(401, {
          success: false,
          error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        }),
      'POST /api/v1/auth/refresh': () => httpError(401, {}),
    });
    const api = createAuthApi(client);
    const error = await api
      .login({ email: 'a@b.co', password: 'wrong-password' })
      .catch((err) => err);
    assert.strictEqual(error.message, 'Invalid email or password.');
    assert.strictEqual(error.code, 'AUTH_INVALID_CREDENTIALS');
    assert.strictEqual(error.status, 401);
  });

  test('toApiError falls back safely on network failures', () => {
    const error = toApiError(new Error('Network Error'));
    assert.strictEqual(error.code, 'UNKNOWN_ERROR');
    assert.strictEqual(error.status, 0);
  });
});
