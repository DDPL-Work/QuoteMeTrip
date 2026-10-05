import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  getWeatherForLocation,
  getWeatherForRoute,
} from '../../src/integrations/weather/weather.service.js';

describe('Weather Integration & Endpoint Test Suite', () => {
  test('getWeatherForLocation returns normalized forecast object for valid destination', async () => {
    const res = await getWeatherForLocation('Dehradun', '2026-10-15');
    assert.ok(res, 'Response should exist');
    assert.strictEqual(typeof res.available, 'boolean');
    if (res.available) {
      assert.ok(res.destination, 'Should return destination name');
      assert.ok(typeof res.temperature === 'number', 'Temperature should be numeric');
      assert.ok(res.condition, 'Condition string should exist');
      assert.ok(res.iconKey, 'Icon key should exist');
      assert.ok(
        typeof res.precipitationProbability === 'number',
        'Precipitation probability should be numeric',
      );
    }
  });

  test('getWeatherForLocation handles invalid input gracefully', async () => {
    const res = await getWeatherForLocation('', '');
    assert.strictEqual(res.available, false);
    assert.strictEqual(res.reason, 'INVALID_INPUT');
  });

  test('getWeatherForLocation handles repeated query consistently', async () => {
    const res1 = await getWeatherForLocation('London', '2026-10-15');
    if (res1.available) {
      const res2 = await getWeatherForLocation('London', '2026-10-15');
      assert.ok(res2.available);
      assert.strictEqual(res2.destination, res1.destination);
    }
  });

  test('getWeatherForRoute returns weather array for multiple stops', async () => {
    const routeSummary = {
      stops: [{ name: 'Delhi' }, { name: 'Agra' }],
    };
    const res = await getWeatherForRoute(routeSummary, { date: '2026-10-15' });
    assert.ok(res);
    assert.strictEqual(typeof res.available, 'boolean');
  });

  test('Weather service never leaks WEATHER_API_KEY in returned payload', async () => {
    const res = await getWeatherForLocation('Cappadocia', '2026-10-15');
    const jsonString = JSON.stringify(res);
    const secret = process.env.WEATHER_API_KEY;
    if (secret) {
      assert.strictEqual(
        jsonString.includes(secret),
        false,
        'Secret API key must never be leaked in payload',
      );
    }
  });
});
