import React, { useState } from 'react';
import {
  FiMapPin,
  FiClock,
  FiNavigation,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiRefreshCw,
  FiInfo,
} from 'react-icons/fi';

/**
 * RouteOverviewSummary
 *
 * Dedicated journey overview presented alongside or above the Google Map.
 * Displays:
 * - Total road distance (from Google Routes API)
 * - Estimated driving time (from Google Routes API)
 * - Number of destinations
 * - Recommended sightseeing days (from project's recommendation formula)
 * - Detailed stop-by-stop / leg-by-leg breakdown
 * - Stale route indicator when stops list is modified after calculation
 */
export function RouteOverviewSummary({
  route = null,
  stops = [],
  recommendedDays = null,
  isStale = false,
  onRecalculate = null,
  isCalculating = false,
}) {
  const [legsExpanded, setLegsExpanded] = useState(false);

  if (!route && stops.length < 2) {
    return null;
  }

  const distanceKm = route?.distanceKm ?? route?.totalDistanceKm ?? 0;
  const durationMins = route?.durationMinutes ?? route?.estimatedDurationMinutes ?? 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const formattedDuration =
    hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${mins} mins`;

  const recDays = recommendedDays ?? route?.recommendedDays ?? Math.max(1, Math.ceil(distanceKm / 300) + Math.ceil(Math.max(0, stops.length - 2) / 2));
  const legs = route?.legs || [];
  const warnings = route?.warnings || [];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2DCD1',
        boxShadow: '0 4px 20px rgba(19, 41, 28, 0.06)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Banner / Route Sequence */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)',
          color: '#FFFFFF',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FC7C00',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiNavigation size={13} /> Road Journey Summary
          </span>
          <span
            style={{
              fontSize: '11.5px',
              background: isStale ? 'rgba(252, 124, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)',
              color: isStale ? '#FFE0B2' : '#FFFFFF',
              padding: '3px 9px',
              borderRadius: '999px',
              fontWeight: '700',
            }}
          >
            {isStale ? 'Update Needed' : route ? 'Google Routes Calculated' : 'Stops Configured'}
          </span>
        </div>

        {/* Route Chain: e.g. Istanbul → Bursa → Bodrum */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          {stops.map((stop, i) => (
            <React.Fragment key={stop.id || i}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: i === 0 ? '#E5F2EA' : i === stops.length - 1 ? '#FC7C00' : '#FFFFFF',
                }}
              >
                {stop.name}
              </span>
              {i < stops.length - 1 && (
                <span style={{ opacity: 0.6, fontSize: '14px' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stale Warning Banner */}
      {isStale && onRecalculate && (
        <div
          style={{
            background: '#FFF3E0',
            borderBottom: '1px solid #FFE0B2',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#B75500',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            <FiAlertTriangle size={16} />
            Stops changed — recalculate to refresh road route and metrics.
          </div>
          <button
            type="button"
            onClick={onRecalculate}
            disabled={isCalculating}
            style={{
              background: '#FC7C00',
              color: '#FFFFFF',
              border: 0,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isCalculating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <FiRefreshCw size={13} className={isCalculating ? 'animate-spin' : ''} />
            Recalculate
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          padding: '16px 20px',
          background: '#FAF8F5',
          borderBottom: legs.length > 0 ? '1px solid #E2DCD1' : 'none',
        }}
      >
        {/* Total Road Distance */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #E8E3D9',
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              color: '#66716B',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <FiNavigation size={13} style={{ color: '#147D33' }} /> Road Distance
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {distanceKm > 0 ? `${distanceKm.toLocaleString()} km` : '—'}
          </div>
        </div>

        {/* Driving Duration */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #E8E3D9',
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              color: '#66716B',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <FiClock size={13} style={{ color: '#147D33' }} /> Driving Time
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {durationMins > 0 ? formattedDuration : '—'}
          </div>
        </div>

        {/* Number of Stops */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #E8E3D9',
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              color: '#66716B',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <FiMapPin size={13} style={{ color: '#147D33' }} /> Destinations
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {stops.length} Stops
          </div>
        </div>

        {/* Recommended Trip Duration */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #E8E3D9',
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              color: '#66716B',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <FiCalendar size={13} style={{ color: '#FC7C00' }} /> Recommended
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0C4E28' }}>
            {recDays} Day{recDays > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Leg-by-leg accordion */}
      {legs.length > 0 && (
        <div style={{ padding: '12px 20px' }}>
          <button
            type="button"
            onClick={() => setLegsExpanded(!legsExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 0,
              padding: '6px 0',
              cursor: 'pointer',
              color: '#0C4E28',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            <span>
              Detailed Leg Breakdown ({legs.length} segment{legs.length > 1 ? 's' : ''})
            </span>
            {legsExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>

          {legsExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {legs.map((leg, idx) => {
                const legMins = leg.durationMinutes || 0;
                const legHours = Math.floor(legMins / 60);
                const legRemainingMins = legMins % 60;
                const legDurStr =
                  legHours > 0
                    ? `${legHours}h ${legRemainingMins}m`
                    : `${legRemainingMins}m`;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#F9F8F5',
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: '1px solid #ECE7DE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          background: '#E5F2EA',
                          color: '#0C4E28',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        LEG {idx + 1}
                      </span>
                      <strong style={{ color: '#13291C' }}>
                        {leg.startStopName || stops[idx]?.name} → {leg.endStopName || stops[idx + 1]?.name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4E5754' }}>
                      <span>{leg.distanceKm} km</span>
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span style={{ fontWeight: '600', color: '#13291C' }}>{legDurStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Warnings if Google returned routing notices */}
      {warnings.length > 0 && (
        <div
          style={{
            background: '#FFF9E6',
            padding: '10px 16px',
            borderTop: '1px solid #FFE082',
            fontSize: '12px',
            color: '#8D6E00',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiInfo size={14} />
          {warnings.join(', ')}
        </div>
      )}
    </div>
  );
}
export default RouteOverviewSummary;
