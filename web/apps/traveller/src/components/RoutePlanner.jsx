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
} from 'react-icons/fi';
import { RouteMap } from './RouteMap.jsx';

/**
 * RoutePlanner Component (Phase 4)
 * Premium Route-First trip planning tool.
 * Handles Start Location, Intermediate Stops, and Final Destination.
 */
export function RoutePlanner({
  stops = [],
  onAddStop,
  onRemoveStop,
  onReorderStops,
  onCalculate,
  calculationStatus = 'idle',
  apiError = null,
  currentRoute = null,
}) {
  const [newLocationName, setNewLocationName] = useState('');
  const [stopTypeInput, setStopTypeInput] = useState('intermediate');
  const [inputError, setInputError] = useState('');

  // Default coordinate presets for major Turkish travel hubs if manual lat/lng isn't provided
  const DESTINATION_PRESETS = {
    Istanbul: { latitude: 41.0082, longitude: 28.9784 },
    Cappadocia: { latitude: 38.6431, longitude: 34.8289 },
    Antalya: { latitude: 36.8969, longitude: 30.7133 },
    Bodrum: { latitude: 37.0344, longitude: 27.4305 },
    Fethiye: { latitude: 36.6217, longitude: 29.1164 },
    Izmir: { latitude: 38.4237, longitude: 27.1428 },
    Pamukkale: { latitude: 37.9204, longitude: 29.1213 },
    Ephesus: { latitude: 37.9485, longitude: 27.3681 },
    Trabzon: { latitude: 41.0027, longitude: 39.7168 },
    Ankara: { latitude: 39.9334, longitude: 32.8597 },
  };

  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    const name = newLocationName.trim();
    if (!name) {
      setInputError('Please enter a destination name.');
      return;
    }
    setInputError('');

    // Determine coordinates from presets or generate realistic defaults
    const preset = DESTINATION_PRESETS[name] || {
      latitude: 38.5 + (Math.random() - 0.5) * 3,
      longitude: 32.5 + (Math.random() - 0.5) * 5,
    };

    // Auto-determine type if empty: first stop is start, last is final
    let type = stopTypeInput;
    if (stops.length === 0) type = 'start';

    onAddStop({
      name,
      latitude: Number(preset.latitude.toFixed(4)),
      longitude: Number(preset.longitude.toFixed(4)),
      type,
    });

    setNewLocationName('');
    setStopTypeInput('intermediate');
  };

  const isCalculating = calculationStatus === 'calculating';

  return (
    <div className="tf-route-planner-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Step Header */}
      <div style={{ background: '#FFFBF3', padding: '24px', borderRadius: '16px', border: '1px solid #E2DCD1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#147D33', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <FiNavigation size={18} /> Step 1: Design Your Route
        </div>
        <h2 style={{ fontFamily: 'var(--serif, serif)', fontSize: '28px', color: '#13291C', margin: '8px 0 4px' }}>
          Where do you want to travel?
        </h2>
        <p style={{ color: '#4E5754', margin: 0, fontSize: '15px' }}>
          Add your starting city, any intermediate stops, and your final destination. We will calculate distance, travel time, and recommended days automatically.
        </p>
      </div>

      {/* Grid Layout: Controls & Map */}
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Stop Management Form */}
        <div className="tf-motion-card" style={{ background: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2DCD1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Add Stop Form */}
          <form onSubmit={handleAddStopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: '#13291C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPlus style={{ color: '#FC7C00' }} /> Add Destination
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <FiMapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#147D33' }} />
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Istanbul, Cappadocia, Bodrum..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    border: '1px solid #D5CDBF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                  list="destination-suggestions"
                />
                <datalist id="destination-suggestions">
                  {Object.keys(DESTINATION_PRESETS).map((place) => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
              </div>

              <select
                value={stopTypeInput}
                onChange={(e) => setStopTypeInput(e.target.value)}
                style={{
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid #D5CDBF',
                  fontSize: '13px',
                  background: '#F9F8F5',
                  color: '#13291C',
                  fontWeight: '600'
                }}
              >
                {stops.length === 0 ? (
                  <option value="start">Start Point</option>
                ) : (
                  <>
                    <option value="intermediate">Stop</option>
                    <option value="final">Final Destination</option>
                    <option value="start">Start Point</option>
                  </>
                )}
              </select>

              <button
                type="submit"
                style={{
                  padding: '0 18px',
                  background: '#147D33',
                  color: '#fff',
                  border: 0,
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease, transform 0.15s ease',
                }}
              >
                Add
              </button>
            </div>

            {inputError && (
              <span role="alert" style={{ color: '#D93025', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiAlertCircle /> {inputError}
              </span>
            )}
          </form>

          {/* Stop List */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#13291C' }}>
                Selected Route ({stops.length} stops)
              </span>
              {stops.length > 0 && (
                <span style={{ fontSize: '12px', color: '#4E5754' }}>
                  Use arrows to reorder
                </span>
              )}
            </div>

            {stops.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#FFFBF3', border: '1px dashed #D5CDBF', borderRadius: '12px', color: '#56625B', fontSize: '14px' }}>
                No stops added yet. Add your starting point above to begin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stops.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === stops.length - 1;
                  const badgeColor = isFirst ? '#0C4E28' : isLast ? '#FC7C00' : '#147D33';
                  const badgeText = isFirst ? 'START' : isLast ? 'FINAL' : `STOP ${index}`;

                  return (
                    <div
                      key={stop.id || index}
                      className="animate-scale-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#FFFBF3',
                        border: '1px solid #E2DCD1',
                        borderRadius: '10px',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', background: badgeColor, color: '#fff', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                          {badgeText}
                        </span>
                        <strong style={{ fontSize: '15px', color: '#13291C' }}>{stop.name}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => onReorderStops(index, index - 1)}
                          title="Move up"
                          aria-label={`Move ${stop.name} up`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: isFirst ? 'not-allowed' : 'pointer',
                            opacity: isFirst ? 0.3 : 1,
                            padding: '6px',
                            color: '#13291C'
                          }}
                        >
                          <FiArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => onReorderStops(index, index + 1)}
                          title="Move down"
                          aria-label={`Move ${stop.name} down`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: isLast ? 'not-allowed' : 'pointer',
                            opacity: isLast ? 0.3 : 1,
                            padding: '6px',
                            color: '#13291C'
                          }}
                        >
                          <FiArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveStop(stop.id)}
                          title="Remove stop"
                          aria-label={`Remove ${stop.name}`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '6px',
                            color: '#D93025'
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

          {/* Action Button */}
          {apiError && (
            <div role="alert" style={{ background: '#FCE8E6', color: '#D93025', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}>
              {apiError}
            </div>
          )}

          <button
            type="button"
            onClick={onCalculate}
            disabled={stops.length < 2 || isCalculating}
            style={{
              width: '100%',
              padding: '14px',
              background: stops.length < 2 ? '#C4C4C4' : 'linear-gradient(135deg, #FC7C00 0%, #E06D00 100%)',
              color: '#fff',
              border: 0,
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '16px',
              cursor: stops.length < 2 || isCalculating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: 'auto',
              boxShadow: stops.length >= 2 ? '0 4px 14px rgba(252, 124, 0, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isCalculating ? (
              <>Calculating route...</>
            ) : (
              <>
                <FiCheckCircle size={18} /> Calculate Route ({stops.length} stops)
              </>
            )}
          </button>
        </div>

        {/* Right Side: Route Map (Wider Footprint) */}
        <div className="tf-motion-card" style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2DCD1', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0C4E28', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiMapPin style={{ color: '#147D33' }} size={18} /> Visual OpenStreetMap Route Preview
            </span>
            <span style={{ fontSize: '12px', color: '#56625B', background: '#E5F2EA', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
              Interactive Canvas
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '440px', borderRadius: '14px', overflow: 'hidden' }}>
            <RouteMap stops={stops} geometry={currentRoute?.geometry} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoutePlanner;
