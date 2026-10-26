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
import { useI18n } from '@troublefree/i18n';

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
  travelMode = null,
  apiError = null,
  calculationStatus = null,
}) {
  const { t, locale } = useI18n();
  const [legsExpanded, setLegsExpanded] = useState(false);

  if (!route && stops.length < 2) {
    return null;
  }

  // Authoritative active mode: prefer explicitly selected travelMode prop, fallback to route.travelMode
  const activeMode = String(travelMode || route?.travelMode || 'DRIVE').toUpperCase();
  const isAir = activeMode === 'AIR' || route?.isAir;

  // Detect mode mismatch: route in memory was calculated for a different mode than currently selected
  const isModeMismatch = Boolean(route && route.travelMode && route.travelMode.toUpperCase() !== activeMode);
  const effectiveStale = isStale || isModeMismatch;
  const hasError = Boolean(calculationStatus === 'error' || apiError);

  // Never display driving duration or distance under another mode's label
  const hasValidRouteMetrics = Boolean(route && !isModeMismatch);
  const distanceKm = hasValidRouteMetrics ? (route?.distanceKm ?? route?.totalDistanceKm ?? 0) : 0;
  const durationMins = hasValidRouteMetrics ? (route?.durationMinutes ?? route?.estimatedDurationMinutes ?? null) : null;

  let distanceLabel = t('route.roadDistance', 'Road Distance');
  let durationLabel = t('route.drivingTime', 'Driving Time');
  let summaryTitle = t('route.journeySummary', 'Road Journey Summary');

  if (isAir) {
    distanceLabel = t('route.airDistance', 'Straight-Line Air Distance');
    durationLabel = t('route.airDuration', 'Flight Duration');
    summaryTitle = t('route.airJourneySummary', 'Air Journey Summary (Great-Circle)');
  } else if (activeMode === 'WALK') {
    distanceLabel = t('route.walkDistance', 'Walking Distance');
    durationLabel = t('route.walkDuration', 'Walking Time');
    summaryTitle = t('route.walkJourneySummary', 'Walking Journey Summary');
  } else if (activeMode === 'BICYCLE') {
    distanceLabel = t('route.cycleDistance', 'Cycling Distance');
    durationLabel = t('route.cycleDuration', 'Cycling Time');
    summaryTitle = t('route.cycleJourneySummary', 'Cycling Journey Summary');
  } else if (activeMode === 'TWO_WHEELER') {
    distanceLabel = t('route.motoDistance', 'Motorcycle Distance');
    durationLabel = t('route.motoDuration', 'Riding Time');
    summaryTitle = t('route.motoJourneySummary', 'Motorcycle Journey Summary');
  } else if (activeMode === 'TRANSIT') {
    distanceLabel = t('route.transitDistance', 'Transit Distance');
    durationLabel = t('route.transitDuration', 'Transit Duration');
    summaryTitle = t('route.transitJourneySummary', 'Transit Journey Summary');
  }

  let formattedDuration = '—';
  if (isAir) {
    formattedDuration = t('route.notApplicable', 'N/A (Great-Circle)');
  } else if (isCalculating && isModeMismatch) {
    formattedDuration = locale === 'tr' ? 'Hesaplanıyor...' : 'Calculating...';
  } else if (durationMins !== null && durationMins !== undefined && durationMins > 0) {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    formattedDuration =
      hours > 0
        ? locale === 'tr'
          ? `${hours} sa ${mins} dk`
          : `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`
        : locale === 'tr'
        ? `${mins} dk`
        : `${mins} mins`;
  }

  const recDays = recommendedDays ?? route?.recommendedDays ?? Math.max(1, Math.ceil(distanceKm / 300) + Math.ceil(Math.max(0, stops.length - 2) / 2));
  const legs = hasValidRouteMetrics ? (route?.legs || []) : [];
  const warnings = route?.warnings || [];

  let badgeText;
  if (isCalculating) {
    badgeText = locale === 'tr' ? `${activeMode} Hesaplanıyor...` : `Calculating ${activeMode}...`;
  } else if (hasError && !route) {
    badgeText = locale === 'tr' ? `${activeMode} Rota Bulunamadı` : `${activeMode} Unavailable`;
  } else if (effectiveStale) {
    badgeText = t('route.updateNeeded', 'Update Needed');
  } else if (route) {
    badgeText = `${activeMode} Route Calculated`;
  } else {
    badgeText = t('route.stopsConfigured', 'Stops Configured');
  }

  let headerGradient = 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)';
  if (hasError && !route) {
    headerGradient = 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)';
  } else if (isAir) {
    headerGradient = 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)';
  } else if (activeMode === 'WALK') {
    headerGradient = 'linear-gradient(135deg, #92400E 0%, #B45309 100%)';
  } else if (activeMode === 'BICYCLE') {
    headerGradient = 'linear-gradient(135deg, #065F46 0%, #059669 100%)';
  } else if (activeMode === 'TRANSIT') {
    headerGradient = 'linear-gradient(135deg, #5B21B6 0%, #6D28D9 100%)';
  } else if (activeMode === 'TWO_WHEELER') {
    headerGradient = 'linear-gradient(135deg, #064E3B 0%, #047857 100%)';
  }

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
          background: headerGradient,
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
              color: isAir ? '#E0F2FE' : '#FC7C00',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiNavigation size={13} />{' '}
            {summaryTitle}
          </span>
          <span
            style={{
              fontSize: '11.5px',
              background: effectiveStale ? 'rgba(252, 124, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)',
              color: effectiveStale ? '#FFE0B2' : '#FFFFFF',
              padding: '3px 9px',
              borderRadius: '999px',
              fontWeight: '700',
            }}
          >
            {badgeText}
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

      {/* Error / Unavailable Mode Notice Banner */}
      {hasError && !route && apiError && (
        <div
          style={{
            background: '#FEF2F2',
            borderBottom: '1px solid #FECACA',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#B91C1C',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <FiAlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Mode-Specific Guidance Banner */}
      {isAir && (
        <div
          style={{
            background: '#F0F9FF',
            borderBottom: '1px solid #BAE6FD',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#0369A1',
            fontSize: '12.5px',
            fontWeight: '500',
          }}
        >
          <FiInfo size={15} style={{ flexShrink: 0 }} />
          <span>
            {t(
              'route.airNotice',
              'Air mode shows straight-line great-circle distance between destinations. Actual flight paths, airlines, and schedules vary.',
            )}
          </span>
        </div>
      )}
      {activeMode === 'BICYCLE' && (
        <div
          style={{
            background: '#ECFDF5',
            borderBottom: '1px solid #A7F3D0',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#065F46',
            fontSize: '12.5px',
            fontWeight: '500',
          }}
        >
          <FiInfo size={15} style={{ flexShrink: 0 }} />
          <span>
            {t(
              'route.bicycleNotice',
              'Bicycle routes: Google Maps cycling coverage may be incomplete or caution advised on shared roads.',
            )}
          </span>
        </div>
      )}
      {activeMode === 'WALK' && (
        <div
          style={{
            background: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#92400E',
            fontSize: '12.5px',
            fontWeight: '500',
          }}
        >
          <FiInfo size={15} style={{ flexShrink: 0 }} />
          <span>
            {t(
              'route.walkNotice',
              'Pedestrian walking routes: walkway availability may be limited on long connecting stretches.',
            )}
          </span>
        </div>
      )}
      {activeMode === 'TRANSIT' && (
        <div
          style={{
            background: '#F5F3FF',
            borderBottom: '1px solid #DDD6FE',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#5B21B6',
            fontSize: '12.5px',
            fontWeight: '500',
          }}
        >
          <FiInfo size={15} style={{ flexShrink: 0 }} />
          <span>
            {t(
              'route.transitNotice',
              'Public transit routing connects start and final destination via regional transit schedules where supported.',
            )}
          </span>
        </div>
      )}

      {/* Stale Warning Banner */}
      {effectiveStale && onRecalculate && (
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
            {t('route.staleWarning', 'Stops or travel mode changed — recalculate to refresh route and metrics.')}
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
            {t('route.recalculateBtn', 'Recalculate')}
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
        {/* Total Distance */}
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
            <FiNavigation size={13} style={{ color: isAir ? '#0284C7' : '#147D33' }} /> {distanceLabel}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {distanceKm > 0 ? `${distanceKm.toLocaleString()} km` : '—'}
          </div>
        </div>

        {/* Travel Duration */}
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
            <FiClock size={13} style={{ color: isAir ? '#0284C7' : '#147D33' }} /> {durationLabel}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {formattedDuration}
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
            <FiMapPin size={13} style={{ color: '#147D33' }} /> {t('route.destinations', 'Destinations')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#13291C' }}>
            {locale === 'tr' ? `${stops.length} Durak` : `${stops.length} Stop${stops.length !== 1 ? 's' : ''}`}
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
            <FiCalendar size={13} style={{ color: '#FC7C00' }} /> {t('route.recommended', 'Recommended')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0C4E28' }}>
            {locale === 'tr' ? `${recDays} Gün` : `${recDays} Day${recDays !== 1 ? 's' : ''}`}
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
              {t('route.legBreakdown', { count: legs.length }, `Detailed Leg Breakdown (${legs.length} segments)`)}
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
