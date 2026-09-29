/**
 * Weather integration boundary (Phase 4).
 *
 * Minimal by design: request creation must NEVER depend on weather
 * availability. All failures degrade gracefully to
 * `{ available: false }` so the travel-request workflow keeps working
 * with or without credentials. A full weather subsystem belongs to a
 * later phase.
 */

import { WeatherCache } from '../../db/models/index.js';

/**
 * Weather integration boundary (Phase 8).
 */

async function fetchFromProvider(location, date) {
  if (!process.env.WEATHER_API_KEY) {
    return { available: false, reason: 'WEATHER_NOT_CONFIGURED' };
  }
  // Mock external API call for Phase 8
  const temperature = Math.floor(Math.random() * 20) + 15;
  const conditions = ['Sunny', 'Cloudy', 'Rain', 'Clear'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  return {
    available: true,
    temperature,
    condition,
    rainProbability: Math.floor(Math.random() * 100),
  };
}

export async function getWeatherForLocation(locationStr, dateStr) {
  if (!locationStr || !dateStr) {
    return { available: false, reason: 'INVALID_INPUT' };
  }

  try {
    // Check cache
    const cacheHit = await WeatherCache.findOne({
      where: { locationKey: locationStr, date: dateStr },
    });

    if (cacheHit && cacheHit.expiresAt > new Date()) {
      return { ...cacheHit.response, cached: true };
    }

    // Fetch from provider
    const response = await fetchFromProvider(locationStr, dateStr);

    if (response.available) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4); // Cache for 4 hours

      if (cacheHit) {
        cacheHit.response = response;
        cacheHit.expiresAt = expiresAt;
        await cacheHit.save();
      } else {
        await WeatherCache.create({
          locationKey: locationStr,
          date: dateStr,
          provider: 'mock_weather_api',
          response,
          expiresAt,
        });
      }
    }

    return response;
  } catch (error) {
    console.error('[WeatherService] Error fetching weather:', error);
    return { available: false, reason: 'WEATHER_ERROR' };
  }
}

export async function getWeatherForRoute(_routeSummary = {}, _options = {}) {
  return { available: false, reason: 'NOT_YET_IMPLEMENTED_FOR_FULL_ROUTE' };
}
