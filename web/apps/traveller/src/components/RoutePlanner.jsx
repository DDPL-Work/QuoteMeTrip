import React, { useState } from 'react';
import {
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiNavigation,
  FiCheckCircle,
  FiAlertCircle,
  FiRotateCcw,
  FiCompass,
  FiClock,
  FiRefreshCw,
  FiLayers,
} from 'react-icons/fi';
import {
  FaCar,
  FaMotorcycle,
  FaWalking,
  FaBicycle,
  FaBus,
  FaPlane,
} from 'react-icons/fa';
import { RouteMap } from './RouteMap.jsx';
import { DestinationAutocomplete } from './DestinationAutocomplete.jsx';
import { RouteOverviewSummary } from './RouteOverviewSummary.jsx';
import { useI18n } from '@troublefree/i18n';

/**
 * RoutePlanner Component (Google Maps Platform Edition)
 *
 * Premium Route-First trip planning workspace.
 * Features:
 * - 42% / 58% desktop split workspace (controls & stops vs interactive Google Map & overview)
 * - Google Places autocomplete destination search
 * - Distinct numbered destination cards with role badges (1 · START, 2 · STOP, 3 · FINAL)
 * - Stop reordering and removal controls with instantaneous feedback
 * - Clear route action
 * - High-visibility Calculate Route button with all 5 discrete states
 * - Dedicated journey summary with real Google road distance and driving time
 * - Responsive layout adapted to desktop, tablet, and mobile viewports
 */
export function RoutePlanner({
  stops = [],
  travelMode = 'DRIVE',
  onSelectTravelMode = null,
  onAddStop,
  onRemoveStop,
  onReorderStops,
  onCalculate,
  onAdvanceStep = null,
  onClearRoute,
  calculationStatus = 'idle',
  isStale = false,
  apiError = null,
  currentRoute = null,
  recommendedDays = null,
}) {
  const { t } = useI18n();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [stopTypeInput, setStopTypeInput] = useState('intermediate');
  const [inputError, setInputError] = useState('');

  const isCalculating = calculationStatus === 'calculating';
  const isCalculated = calculationStatus === 'calculated';

  const TRAVEL_MODES = [
    { id: 'DRIVE', icon: FaCar, name: t('route.modeDrive', 'Drive'), hint: t('route.modeDriveHint', 'Highway road route') },
    { id: 'TWO_WHEELER', icon: FaMotorcycle, name: t('route.modeMoto', 'Motorcycle'), hint: t('route.modeMotoHint', 'Two-wheeler routing') },
    { id: 'WALK', icon: FaWalking, name: t('route.modeWalk', 'Walk'), hint: t('route.modeWalkHint', 'Pedestrian route') },
    { id: 'BICYCLE', icon: FaBicycle, name: t('route.modeCycle', 'Bicycle'), hint: t('route.modeCycleHint', 'Cycling path') },
    { id: 'TRANSIT', icon: FaBus, name: t('route.modeTransit', 'Transit'), hint: t('route.modeTransitHint', 'Public transit (2 stops)') },
    { id: 'AIR', icon: FaPlane, name: t('route.modeAir', 'Air'), hint: t('route.modeAirHint', 'Straight-line great-circle') },
  ];

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setInputError('');
  };

  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlace) {
      setInputError(t('route.selectFromSuggestions', 'Please search and select a destination from suggestions.'));
      return;
    }

    // Auto-assign type if list was empty
    let type = stopTypeInput;
    if (stops.length === 0) {
      type = 'start';
    }

    onAddStop({
      name: selectedPlace.name,
      formattedAddress: selectedPlace.formattedAddress || selectedPlace.name,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      placeId: selectedPlace.placeId || null,
      type,
    });

    setSelectedPlace(null);
    setStopTypeInput('intermediate');
    setInputError('');
  };

  return (
    <div
      className="qmt-route-planner-workspace"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
      }}
    >
      {/* Workspace Header Banner */}
      <div
        style={{
          background: '#FFFBF3',
          padding: '24px 28px',
          borderRadius: '16px',
          border: '1px solid #E2DCD1',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#147D33',
            fontWeight: '800',
            fontSize: '12.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          <FiCompass size={17} /> {t('route.step1Header', 'Step 1: Design & Calculate Road Route')}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--serif, serif)',
              fontSize: '30px',
              color: '#13291C',
              margin: 0,
              fontWeight: '700',
            }}
          >
            {t('route.heading', 'Where would you like to travel?')}
          </h2>
          {stops.length > 0 && onClearRoute && (
            <button
              type="button"
              onClick={onClearRoute}
              style={{
                background: 'transparent',
                border: '1px solid #D5CDBF',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12.5px',
                color: '#66716B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
              }}
            >
              <FiRotateCcw size={13} /> {t('route.clearRoute', 'Clear Route')}
            </button>
          )}
        </div>
        <p style={{ color: '#4E5754', margin: 0, fontSize: '14.5px', maxWidth: '800px', lineHeight: 1.5 }}>
          {t('route.subtitle', 'Add your starting city, intermediate scenic stops, and final destination. Our Google Maps routing engine calculates real driving distance, estimated highway travel duration, and recommended sightseeing days.')}
        </p>
      </div>

      {/* Main Split Layout: 42% Controls | 58% Map & Journey Overview */}
      <div className="qmt-route-split-container">
        {/* LEFT COLUMN: Destination Controls & Stop List (42%) */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #E2DCD1',
            boxShadow: '0 4px 16px rgba(19, 41, 28, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {/* Travel Mode Selector */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingBottom: '16px',
              borderBottom: '1px solid #EAE5DC',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#13291C',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiLayers style={{ color: '#147D33' }} /> {t('route.travelMode', 'Travel Mode')}
              </label>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#66716B',
                  background: '#F0ECE1',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {TRAVEL_MODES.find((m) => m.id === travelMode)?.name || travelMode}
              </span>
            </div>

            <div
              className="qmt-travel-mode-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {TRAVEL_MODES.map((mode) => {
                const isSelected = travelMode === mode.id;
                const IconComp = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onSelectTravelMode && onSelectTravelMode(mode.id)}
                    title={mode.hint}
                    aria-label={`${mode.name}: ${mode.hint}`}
                    aria-pressed={isSelected}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px 6px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0C4E28' : '1px solid #D5CDBF',
                      background: isSelected ? '#E5F2EA' : '#FFFFFF',
                      color: isSelected ? '#0C4E28' : '#2D3732',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(12, 78, 40, 0.15)' : 'none',
                    }}
                  >
                    <IconComp size={18} style={{ color: isSelected ? '#0C4E28' : '#5A6560' }} aria-hidden="true" />
                    <span style={{ whiteSpace: 'nowrap' }}>{mode.name}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '11.5px', color: '#66716B', marginTop: '2px' }}>
              {TRAVEL_MODES.find((m) => m.id === travelMode)?.hint}
            </div>
          </div>

          {/* Add Stop Form */}
          <form
            onSubmit={handleAddStopSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: 0,
                  color: '#13291C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiPlus style={{ color: '#FC7C00' }} /> {t('route.addDestination', 'Add Destination')}
              </h3>
              <span style={{ fontSize: '12px', color: '#66716B' }}>
                {t('route.placesAutocomplete', 'Google Places Autocomplete')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <DestinationAutocomplete
                  value={selectedPlace?.name || ''}
                  onChange={(val) => {
                    if (!val) setSelectedPlace(null);
                  }}
                  onSelect={handlePlaceSelect}
                  placeholder={t('route.searchPlaceholder', 'Search city (e.g. Istanbul, Bodrum)...')}
                />
              </div>

              <select
                value={stopTypeInput}
                onChange={(e) => setStopTypeInput(e.target.value)}
                style={{
                  padding: '0 12px',
                  height: '46px',
                  borderRadius: '10px',
                  border: '1px solid #D5CDBF',
                  fontSize: '13px',
                  background: '#F9F8F5',
                  color: '#13291C',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {stops.length === 0 ? (
                  <option value="start">{t('route.startLocationNum', '1. Start Location')}</option>
                ) : (
                  <>
                    <option value="intermediate">{t('route.intermediateStop', 'Stop (Intermediate)')}</option>
                    <option value="final">{t('route.finalDestination', 'Final Destination')}</option>
                    <option value="start">{t('route.startLocation', 'Start Location')}</option>
                  </>
                )}
              </select>

              <button
                type="submit"
                disabled={!selectedPlace}
                style={{
                  padding: '0 20px',
                  height: '46px',
                  background: selectedPlace ? '#147D33' : '#E0DDD5',
                  color: selectedPlace ? '#FFFFFF' : '#8A948F',
                  border: 0,
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: selectedPlace ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiPlus size={16} /> {t('route.add', 'Add')}
              </button>
            </div>

            {inputError && (
              <span
                role="alert"
                style={{
                  color: '#D93025',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500',
                }}
              >
                <FiAlertCircle /> {inputError}
              </span>
            )}
          </form>

          {/* Selected Stops List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '6px',
                borderBottom: '1px solid #ECE7DE',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#13291C' }}>
                {t('route.selectedDestinations', { count: stops.length }, `Selected Destinations (${stops.length})`)}
              </span>
              {stops.length > 1 && (
                <span style={{ fontSize: '12px', color: '#66716B' }}>
                  {t('route.adjustOrder', 'Use arrows to adjust routing order')}
                </span>
              )}
            </div>

            {stops.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#FFFBF3',
                  border: '1.5px dashed #D5CDBF',
                  borderRadius: '14px',
                  color: '#56625B',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiMapPin size={28} style={{ color: '#147D33', opacity: 0.7 }} />
                <strong style={{ fontSize: '15px', color: '#13291C' }}>
                  {t('route.noDestinations', 'No destinations added yet')}
                </strong>
                <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '320px' }}>
                  {t('route.noDestinationsDesc', 'Search your starting point above to begin crafting your personalized road trip.')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stops.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === stops.length - 1;
                  const badgeColor = isFirst ? '#0C4E28' : isLast ? '#FC7C00' : '#147D33';
                  const badgeRole = isFirst
                    ? t('route.badgeStart', 'START')
                    : isLast
                    ? t('route.badgeFinal', 'FINAL')
                    : t('route.badgeStop', 'STOP');

                  return (
                    <div
                      key={stop.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#FFFBF3',
                        border: '1px solid #E2DCD1',
                        borderRadius: '12px',
                        gap: '12px',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {/* Number Badge with Role */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: badgeColor,
                            color: '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '11px',
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                          }}
                        >
                          <span>{index + 1} · {badgeRole}</span>
                        </div>

                        {/* Location Details */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong
                            style={{
                              fontSize: '15px',
                              color: '#13291C',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {stop.name}
                          </strong>
                          {stop.formattedAddress && stop.formattedAddress !== stop.name && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#66716B',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {stop.formattedAddress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reordering & Remove Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => onReorderStops(index, index - 1)}
                          title={`Move ${stop.name} up`}
                          aria-label={`Move ${stop.name} up`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: isFirst ? 'not-allowed' : 'pointer',
                            opacity: isFirst ? 0.25 : 1,
                            padding: '6px',
                            color: '#13291C',
                            borderRadius: '6px',
                          }}
                        >
                          <FiArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => onReorderStops(index, index + 1)}
                          title={`Move ${stop.name} down`}
                          aria-label={`Move ${stop.name} down`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: isLast ? 'not-allowed' : 'pointer',
                            opacity: isLast ? 0.25 : 1,
                            padding: '6px',
                            color: '#13291C',
                            borderRadius: '6px',
                          }}
                        >
                          <FiArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveStop(stop.id)}
                          title={`Remove ${stop.name}`}
                          aria-label={`Remove ${stop.name}`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '6px',
                            color: '#D93025',
                            borderRadius: '6px',
                          }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div
              role="alert"
              style={{
                background: '#FCE8E6',
                border: '1px solid #F5C6CB',
                color: '#D93025',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                lineHeight: 1.4,
              }}
            >
              <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{apiError}</div>
            </div>
          )}

          {/* Calculate Route Action Button */}
          <button
            type="button"
            onClick={onCalculate}
            disabled={stops.length < 2 || isCalculating}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 0,
              fontWeight: '800',
              fontSize: '16px',
              cursor: stops.length < 2 || isCalculating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              marginTop: 'auto',
              background:
                stops.length < 2
                  ? '#C9C4BA'
                  : isStale
                  ? 'linear-gradient(135deg, #FC7C00 0%, #E37000 100%)'
                  : isCalculated
                  ? 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)'
                  : 'linear-gradient(135deg, #FC7C00 0%, #E37000 100%)',
              color: '#FFFFFF',
              boxShadow:
                stops.length >= 2 ? '0 6px 20px rgba(252, 124, 0, 0.3)' : 'none',
            }}
          >
            {isCalculating ? (
              <>
                <FiRefreshCw size={18} className="animate-spin" />
                {travelMode === 'AIR'
                  ? t('route.calculatingAir', 'Calculating Great-Circle Air Route...')
                  : t('route.calculatingMode', { mode: travelMode }, `Calculating Google ${travelMode} Route...`)}
              </>
            ) : stops.length < 2 ? (
              <>{t('route.minStops', 'Add at least 2 destinations to calculate route')}</>
            ) : isStale ? (
              <>
                <FiRefreshCw size={18} />
                {t('route.recalculate', { count: stops.length }, `Recalculate ${travelMode} Route (${stops.length} stops)`)}
              </>
            ) : isCalculated ? (
              <>
                <FiCheckCircle size={18} />
                {t('route.calculated', { count: stops.length }, `Route Calculated · Recalculate (${stops.length} stops)`)}
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                {t('route.calculate', { count: stops.length }, `Calculate ${travelMode} Route (${stops.length} stops)`)}
              </>
            )}
          </button>

          {/* Continue to Step 2 Action when route is calculated */}
          {isCalculated && onAdvanceStep && (
            <button
              type="button"
              onClick={onAdvanceStep}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid #0C4E28',
                background: '#FFFFFF',
                color: '#0C4E28',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t('route.continueToStep2', 'Continue to Trip Details (Step 2) →')}</span>
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Google Map Canvas & Route Overview (58%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Journey Overview Card (rendered above map when calculated or has stops) */}
          {(currentRoute || stops.length >= 2) && (
            <RouteOverviewSummary
              route={currentRoute}
              stops={stops}
              recommendedDays={recommendedDays}
              isStale={isStale}
              onRecalculate={onCalculate}
              isCalculating={isCalculating}
              travelMode={travelMode}
              apiError={apiError}
              calculationStatus={calculationStatus}
            />
          )}

          {/* Google Road Map Container */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2DCD1',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(19, 41, 28, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4px',
              }}
            >
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: '800',
                  color: travelMode === 'AIR' ? '#0284C7' : '#0C4E28',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiMapPin style={{ color: travelMode === 'AIR' ? '#0284C7' : '#147D33' }} size={17} />
                {travelMode === 'AIR'
                  ? t('route.airRoutePreview', 'Great-Circle Air Route Preview')
                  : t('route.roadRoutePreview', { mode: travelMode }, `Google Maps Route Preview (${travelMode})`)}
              </span>

              <span
                style={{
                  fontSize: '11.5px',
                  color: travelMode === 'AIR' ? '#0369A1' : '#0C4E28',
                  background: travelMode === 'AIR' ? '#E0F2FE' : '#E5F2EA',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontWeight: '700',
                }}
              >
                {travelMode === 'AIR'
                  ? t('route.geodesic', 'Geodesic Great-Circle')
                  : t('route.interactiveRoad', 'Interactive Road Geometry')}
              </span>
            </div>

            <div className="qmt-map-canvas-wrap">
              <RouteMap
                stops={stops}
                geometry={currentRoute?.geometry}
                encodedPolyline={currentRoute?.encodedPolyline}
                travelMode={travelMode}
                isStale={isStale || Boolean(currentRoute?.travelMode && currentRoute.travelMode.toUpperCase() !== travelMode)}
                isCalculating={isCalculating}
                onRecalculate={onCalculate}
                apiError={apiError}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Style Overrides */}
      <style>{`
        .qmt-route-split-container {
          display: grid;
          grid-template-columns: minmax(0, 42fr) minmax(0, 58fr);
          gap: 24px;
          align-items: start;
        }
        .qmt-map-canvas-wrap {
          height: 540px;
          width: 100%;
        }
        @media (max-width: 1024px) {
          .qmt-route-split-container {
            grid-template-columns: 1fr !important;
            gap: 20px;
          }
        }
        @media (max-width: 640px) {
          .qmt-map-canvas-wrap {
            height: 380px;
          }
        }
      `}</style>
    </div>
  );
}

export default RoutePlanner;
