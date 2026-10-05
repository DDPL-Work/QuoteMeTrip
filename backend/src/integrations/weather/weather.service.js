/**
 * Weather integration boundary (Phase 8 + Weather Mastery).
 *
 * Request creation must NEVER depend on weather availability.
 * All failures degrade gracefully to `{ available: false }` so the
 * travel-request workflow keeps working with or without credentials.
 */

import axios from 'axios';
import { WeatherCache } from '../../db/models/index.js';

function mapConditionToIconKey(code, conditionText = '') {
  const text = String(conditionText).toLowerCase();
  if (code === 1000 || text.includes('sunny') || text.includes('clear')) return 'sunny';
  if (code === 1003 || text.includes('partly')) return 'partly_cloudy';
  if (code === 1006 || code === 1009 || text.includes('cloud') || text.includes('overcast'))
    return 'cloudy';
  if (
    text.includes('thunder') ||
    text.includes('storm') ||
    [1087, 1273, 1276, 1279, 1282].includes(code)
  )
    return 'thunderstorm';
  if (
    text.includes('snow') ||
    text.includes('blizzard') ||
    text.includes('sleet') ||
    [1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)
  )
    return 'snow';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return 'rain';
  if (text.includes('wind')) return 'windy';
  if (text.includes('fog') || text.includes('mist')) return 'fog';
  return 'partly_cloudy';
}

function mapWmoCodeToIconKey(wmoCode) {
  if (wmoCode === 0) return 'sunny';
  if ([1, 2, 3].includes(wmoCode)) return 'partly_cloudy';
  if ([45, 48].includes(wmoCode)) return 'fog';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(wmoCode)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(wmoCode)) return 'snow';
  if ([95, 96, 99].includes(wmoCode)) return 'thunderstorm';
  return 'partly_cloudy';
}

async function fetchFromWeatherApi(location, dateStr) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    let data;
    try {
      const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
        params: {
          key: apiKey,
          q: location,
          days: 10,
          dt: dateStr || undefined,
        },
        timeout: 5000,
      });
      data = response.data;
    } catch {
      // Fallback to current.json endpoint if forecast.json fails
      const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
        params: {
          key: apiKey,
          q: location,
        },
        timeout: 5000,
      });
      data = response.data;
    }

    if (!data || !data.location) return null;

    const locName = data.location.name || location;
    const forecastDays = data.forecast?.forecastday || [];

    // Find requested date or use first forecast day or current weather
    let dayData = forecastDays.find((f) => f.date === dateStr)?.day;
    if (!dayData && forecastDays.length > 0) {
      dayData = forecastDays[0].day;
    }

    const current = data.current || {};
    const temp = dayData?.avgtemp_c ?? current.temp_c ?? 22;
    const minTemp = dayData?.mintemp_c ?? temp - 3;
    const maxTemp = dayData?.maxtemp_c ?? temp + 3;
    const condText = dayData?.condition?.text || current.condition?.text || 'Clear';
    const condCode = dayData?.condition?.code || current.condition?.code || 1000;
    const rainProb =
      dayData?.daily_chance_of_rain ?? current.chance_of_rain ?? (current.precip_mm > 0 ? 80 : 10);
    const windSpeed = dayData?.maxwind_kph ?? current.wind_kph ?? 10;
    const humidity = current.humidity ?? 60;

    return {
      available: true,
      destination: locName,
      date:
        dateStr || data.location.localtime?.split(' ')[0] || new Date().toISOString().split('T')[0],
      temperature: Math.round(temp),
      minTemperature: Math.round(minTemp),
      maxTemperature: Math.round(maxTemp),
      condition: condText,
      precipitationProbability: Math.round(rainProb),
      windSpeed: Math.round(windSpeed),
      humidity: Math.round(humidity),
      weatherCode: condCode,
      iconKey: mapConditionToIconKey(condCode, condText),
      source: 'weatherapi',
    };
  } catch (err) {
    console.warn(
      '[WeatherService] WeatherAPI request failed, trying Open-Meteo fallback:',
      err.message,
    );
    return null;
  }
}

async function fetchFromOpenMeteo(location, dateStr) {
  try {
    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: location, count: 1 },
      timeout: 4000,
    });

    const geoResult = geoRes.data?.results?.[0];
    if (!geoResult) return null;

    const { latitude, longitude, name } = geoResult;
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current_weather: true,
        daily:
          'temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weathercode',
        timezone: 'auto',
      },
      timeout: 4000,
    });

    const data = weatherRes.data;
    const daily = data?.daily;
    const current = data?.current_weather;

    let dateIdx = daily?.time?.indexOf(dateStr) ?? -1;
    if (dateIdx === -1) dateIdx = 0;

    const maxTemp = daily?.temperature_2m_max?.[dateIdx] ?? current?.temperature ?? 22;
    const minTemp = daily?.temperature_2m_min?.[dateIdx] ?? maxTemp - 5;
    const temp = current?.temperature ?? Math.round((maxTemp + minTemp) / 2);
    const rainProb = daily?.precipitation_probability_max?.[dateIdx] ?? 15;
    const windSpeed = daily?.wind_speed_10m_max?.[dateIdx] ?? current?.windspeed ?? 12;
    const code = daily?.weathercode?.[dateIdx] ?? current?.weathercode ?? 0;

    return {
      available: true,
      destination: name || location,
      date: dateStr || new Date().toISOString().split('T')[0],
      temperature: Math.round(temp),
      minTemperature: Math.round(minTemp),
      maxTemperature: Math.round(maxTemp),
      condition: 'Forecast Available',
      precipitationProbability: Math.round(rainProb),
      windSpeed: Math.round(windSpeed),
      weatherCode: code,
      iconKey: mapWmoCodeToIconKey(code),
      source: 'open-meteo',
    };
  } catch (err) {
    console.warn('[WeatherService] Open-Meteo request failed:', err.message);
    return null;
  }
}

export async function getWeatherForLocation(locationStr, dateStr) {
  if (!locationStr || typeof locationStr !== 'string' || !locationStr.trim()) {
    return { available: false, reason: 'INVALID_INPUT' };
  }

  const cleanLocation = locationStr.trim();
  const cleanDate =
    dateStr && String(dateStr).trim()
      ? String(dateStr).trim()
      : new Date().toISOString().split('T')[0];

  try {
    // 1. Check cache
    if (WeatherCache && WeatherCache.sequelize && WeatherCache.sequelize.models?.WeatherCache) {
      const cacheHit = await WeatherCache.findOne({
        where: { locationKey: cleanLocation, date: cleanDate },
      });

      if (cacheHit && cacheHit.expiresAt) {
        const expTime = new Date(cacheHit.expiresAt).getTime();
        if (expTime > Date.now()) {
          const respData =
            typeof cacheHit.response === 'string'
              ? JSON.parse(cacheHit.response)
              : cacheHit.response;
          return { ...respData, cached: true };
        }
      }
    }
  } catch (cacheErr) {
    console.warn('[WeatherService] Cache lookup error (continuing):', cacheErr.message);
  }

  // 2. Try WeatherAPI.com
  let weatherData = await fetchFromWeatherApi(cleanLocation, cleanDate);

  // 3. Fallback to Open-Meteo if WeatherAPI failed or was unconfigured
  if (!weatherData) {
    weatherData = await fetchFromOpenMeteo(cleanLocation, cleanDate);
  }

  // 4. Final graceful fallback if both failed
  if (!weatherData) {
    return {
      available: false,
      reason: 'WEATHER_UNAVAILABLE',
      destination: cleanLocation,
      date: cleanDate,
    };
  }

  // 5. Store in cache
  try {
    if (WeatherCache && WeatherCache.sequelize && WeatherCache.sequelize.models?.WeatherCache) {
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4-hour cache
      const cacheHit = await WeatherCache.findOne({
        where: { locationKey: cleanLocation, date: cleanDate },
      });

      if (cacheHit) {
        cacheHit.response = weatherData;
        cacheHit.expiresAt = expiresAt;
        await cacheHit.save();
      } else {
        await WeatherCache.create({
          locationKey: cleanLocation,
          date: cleanDate,
          provider: weatherData.source || 'weather_api',
          response: weatherData,
          expiresAt,
        });
      }
    }
  } catch (cacheSaveErr) {
    console.warn('[WeatherService] Cache save error:', cacheSaveErr.message);
  }

  return weatherData;
}

export async function getWeatherForRoute(routeSummary = {}, options = {}) {
  const stops = routeSummary?.stops || [];
  const dateStr = options.date || new Date().toISOString().split('T')[0];

  if (!stops.length) {
    return { available: false, reason: 'NO_STOPS_PROVIDED' };
  }

  const results = await Promise.all(
    stops.map(async (stop) => {
      const locName = stop.name || stop.cityName || stop.locationName;
      if (!locName) return null;
      return getWeatherForLocation(locName, dateStr);
    }),
  );

  const validResults = results.filter((r) => r && r.available);
  if (!validResults.length) {
    return { available: false, reason: 'WEATHER_UNAVAILABLE_FOR_STOPS' };
  }

  return {
    available: true,
    routeWeather: validResults,
  };
}
