import React from 'react';
import { FiClock, FiMapPin, FiCalendar, FiCheckCircle } from 'react-icons/fi';

/**
 * RouteSummaryCard Component (Phase 4)
 * Displays calculated route metrics:
 * - Total distance (km)
 * - Estimated duration (hours & mins)
 * - Recommended duration (days)
 * - User trip duration selector/override
 */
export function RouteSummaryCard({
  route = null,
  recommendedDays = null,
  overriddenDays = null,
  onOverrideDays = () => {},
}) {
  if (!route) return null;

  const distanceKm = route.distanceKm ?? route.totalDistanceKm ?? 0;
  const durationMins = route.durationMinutes ?? route.estimatedDurationMinutes ?? 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const recommended = recommendedDays ?? route.recommendedDays ?? 3;
  const currentDuration = overriddenDays ?? recommended;

  return (
    <div
      style={{
        background: '#0C4E28',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 8px 24px rgba(12, 78, 40, 0.25)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '14px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.12em',
            color: '#FC7C00',
            textTransform: 'uppercase',
          }}
        >
          Route Summary
        </span>
        <span
          style={{
            fontSize: '13px',
            background: '#147D33',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '999px',
            fontWeight: '600',
          }}
        >
          Calculated
        </span>
      </div>

      {/* Origin & Final */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: '700',
        }}
      >
        <FiMapPin style={{ color: '#FC7C00', flexShrink: 0 }} size={20} />
        <span>{route.startLocation}</span>
        <span style={{ opacity: 0.6 }}>→</span>
        <span>{route.finalDestination}</span>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#CFE0D5',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FiMapPin size={13} /> Distance
          </span>
          <b style={{ fontSize: '20px', fontFamily: 'var(--serif, serif)' }}>{distanceKm} km</b>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#CFE0D5',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FiClock size={13} /> Travel Time
          </span>
          <b style={{ fontSize: '20px', fontFamily: 'var(--serif, serif)' }}>
            {hours > 0 ? `${hours}h ` : ''}
            {mins}m
          </b>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#CFE0D5',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FiCalendar size={13} /> Recommended
          </span>
          <b style={{ fontSize: '20px', fontFamily: 'var(--serif, serif)' }}>{recommended} Days</b>
        </div>
      </div>

      {/* User Duration Selector */}
      <div
        style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="user-duration-input" style={{ fontSize: '13.5px', fontWeight: '600' }}>
            Your Chosen Trip Duration:
          </label>
          <span style={{ fontSize: '12px', color: '#CFE0D5' }}>
            (Recommended: {recommended} days)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            id="user-duration-input"
            type="number"
            min="1"
            max="60"
            value={currentDuration}
            onChange={(e) => onOverrideDays(Number(e.target.value))}
            style={{
              width: '80px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '0',
              fontWeight: '700',
              fontSize: '16px',
              color: '#13291C',
              background: '#FFFFFF',
            }}
          />
          <span style={{ fontSize: '14.5px', fontWeight: '600' }}>Days</span>
          {overriddenDays && overriddenDays !== recommended && (
            <span
              style={{
                fontSize: '12px',
                color: '#FCD34D',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <FiCheckCircle /> Custom duration applied
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default RouteSummaryCard;
