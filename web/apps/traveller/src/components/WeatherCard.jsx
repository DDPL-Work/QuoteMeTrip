import { useState, useEffect } from 'react';
import {
  FiSun,
  FiCloud,
  FiCloudRain,
  FiCloudSnow,
  FiCloudLightning,
  FiWind,
  FiThermometer,
  FiDroplet,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
} from 'react-icons/fi';
import { weatherApi } from '../lib/api.js';

function getWeatherIcon(iconKey, size = 28, color = '#FC7C00') {
  const props = { size, color, 'aria-hidden': 'true' };
  switch (iconKey) {
    case 'sunny':
      return <FiSun {...props} color="#F59E0B" />;
    case 'partly_cloudy':
      return <FiCloud {...props} color="#6B7280" />;
    case 'cloudy':
    case 'fog':
      return <FiCloud {...props} color="#4B5563" />;
    case 'rain':
      return <FiCloudRain {...props} color="#3B82F6" />;
    case 'snow':
      return <FiCloudSnow {...props} color="#60A5FA" />;
    case 'thunderstorm':
      return <FiCloudLightning {...props} color="#8B5CF6" />;
    case 'windy':
      return <FiWind {...props} color="#10B981" />;
    default:
      return <FiSun {...props} color="#F59E0B" />;
  }
}

export function WeatherCard({
  destination = '',
  destinations = [],
  stops = [],
  date = '',
  title = 'Trip Weather Forecast',
  compact = false,
  style = {},
}) {
  // Normalize destination choices
  const destList =
    Array.isArray(destinations) && destinations.length > 0
      ? destinations
      : Array.isArray(stops) && stops.length > 0
        ? stops.map((s) => s.name || s.cityName || s.locationName).filter(Boolean)
        : destination
          ? [destination]
          : [];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeDestination = destList[selectedIndex] || destList[0] || '';

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchForecast(destName, targetDate) {
    if (!destName || !destName.trim()) {
      setWeather(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.getForecast(destName.trim(), targetDate);
      if (res && res.available) {
        setWeather(res);
      } else {
        setWeather({ available: false, reason: res?.reason || 'WEATHER_UNAVAILABLE' });
      }
    } catch (e) {
      setError(e?.message || 'Weather information is temporarily unavailable.');
      setWeather({ available: false, reason: 'FETCH_FAILED' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (activeDestination) {
      fetchForecast(activeDestination, date);
    } else {
      setWeather(null);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [activeDestination, date]);

  // STATE A — NOT READY (No destination selected)
  if (!activeDestination) {
    return (
      <div
        data-testid="weather-card-empty"
        style={{
          background: '#F7F4EE',
          border: '1px dashed #D5CDBF',
          borderRadius: '14px',
          padding: compact ? '12px 16px' : '20px',
          textAlign: 'center',
          color: '#66716B',
          fontSize: '14px',
          ...style,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#0C4E28',
            fontWeight: '600',
          }}
        >
          <FiSun size={18} color="#FC7C00" />
          <span>{title}</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#66716B' }}>
          Add a destination and travel date to see the weather forecast.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="weather-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: compact ? '14px 18px' : '20px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        ...style,
      }}
    >
      {/* Header & Multi-Destination Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #F3F4F6',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: '#FEF3C7',
              padding: '6px 10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiSun size={18} color="#D97706" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '700',
                color: '#0C4E28',
                fontFamily: 'var(--serif, serif)',
              }}
            >
              {title}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: '#4B5563',
                marginTop: '2px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                }}
              >
                <FiMapPin size={12} color="#0C4E28" />
                {activeDestination}
              </span>
              {date && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiCalendar size={12} />
                  {date}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Refresh button & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {destList.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: '#F3F4F6',
                padding: '3px',
                borderRadius: '8px',
              }}
            >
              {destList.map((dest, idx) => (
                <button
                  key={dest + idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 0,
                    background: selectedIndex === idx ? '#0C4E28' : 'transparent',
                    color: selectedIndex === idx ? '#FFFFFF' : '#4B5563',
                    fontSize: '12px',
                    fontWeight: selectedIndex === idx ? '700' : '500',
                    cursor: 'pointer',
                  }}
                >
                  {dest}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-label="Refresh weather"
            onClick={() => fetchForecast(activeDestination, date)}
            disabled={loading}
            style={{
              border: 0,
              background: 'transparent',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiRefreshCw
              size={14}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* STATE B — LOADING */}
      {loading && (
        <div
          data-testid="weather-card-loading"
          style={{
            padding: '24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#6B7280',
            fontSize: '14px',
          }}
        >
          <FiSun size={24} color="#FC7C00" style={{ animation: 'spin 2s linear infinite' }} />
          <span>Fetching weather forecast for {activeDestination}...</span>
        </div>
      )}

      {/* STATE D — ERROR / UNAVAILABLE */}
      {!loading && weather && !weather.available && (
        <div
          data-testid="weather-card-error"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#991B1B',
            fontSize: '13.5px',
          }}
        >
          <FiAlertCircle size={18} color="#DC2626" />
          <span>
            Weather information is temporarily unavailable. Trip planning continues unaffected.
          </span>
        </div>
      )}

      {/* STATE C — SUCCESS / FORECAST AVAILABLE */}
      {!loading && weather && weather.available && (
        <div
          data-testid="weather-card-success"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: '#F9FAFB',
              padding: '16px 20px',
              borderRadius: '12px',
            }}
          >
            {/* Primary Temp & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {getWeatherIcon(weather.iconKey, 38)}
              <div>
                <div
                  style={{ fontSize: '28px', fontWeight: '800', color: '#111827', lineHeight: 1 }}
                >
                  {weather.temperature}°C
                </div>
                <div
                  style={{
                    fontSize: '13.5px',
                    color: '#4B5563',
                    fontWeight: '600',
                    marginTop: '4px',
                  }}
                >
                  {weather.condition}
                </div>
              </div>
            </div>

            {/* Sub-Metrics: Min/Max, Rain, Wind */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              {typeof weather.minTemperature === 'number' &&
                typeof weather.maxTemperature === 'number' && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        fontWeight: '700',
                      }}
                    >
                      Low / High
                    </div>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '2px',
                      }}
                    >
                      {weather.minTemperature}° / {weather.maxTemperature}°
                    </div>
                  </div>
                )}

              {typeof weather.precipitationProbability === 'number' && (
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <FiDroplet size={10} color="#3B82F6" /> Rain
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: '#1D4ED8',
                      marginTop: '2px',
                    }}
                  >
                    {weather.precipitationProbability}%
                  </div>
                </div>
              )}

              {typeof weather.windSpeed === 'number' && (
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <FiWind size={10} color="#10B981" /> Wind
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: '#047857',
                      marginTop: '2px',
                    }}
                  >
                    {weather.windSpeed} km/h
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Metadata Badge (Cached/Source indicator) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#9CA3AF',
            }}
          >
            <span>Destination Forecast • {activeDestination}</span>
            {weather.cached && (
              <span
                style={{
                  background: '#ECFDF5',
                  color: '#047857',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiCheckCircle size={10} /> Cached
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherCard;
