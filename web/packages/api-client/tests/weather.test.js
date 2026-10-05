import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createApiClient, createWeatherApi } from '../src/index.js';

describe('weather resource API', () => {
  test('getForecast unwraps the weather response data', async () => {
    const mockTransport = {
      defaults: { baseURL: 'http://localhost:5001' },
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
      get: async (url, config) => {
        assert.strictEqual(url, '/api/v1/weather');
        assert.strictEqual(config.params.destination, 'Dehradun');
        assert.strictEqual(config.params.date, '2026-10-15');
        return {
          status: 200,
          data: {
            status: 'success',
            data: {
              available: true,
              destination: 'Dehradun',
              temperature: 26,
              condition: 'Sunny',
            },
          },
        };
      },
    };

    const client = createApiClient({ baseURL: 'http://localhost:5001', transport: mockTransport });
    const weather = createWeatherApi(client);
    const result = await weather.getForecast('Dehradun', '2026-10-15');

    assert.strictEqual(result.available, true);
    assert.strictEqual(result.destination, 'Dehradun');
    assert.strictEqual(result.temperature, 26);
    assert.strictEqual(result.condition, 'Sunny');
  });
});
