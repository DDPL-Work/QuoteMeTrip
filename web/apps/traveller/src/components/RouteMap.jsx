import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiAlertCircle,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
} from 'react-icons/fi';
import { loadGoogleMaps, isGoogleMapsLoaded, onGoogleMapsAuthFailure } from '../lib/googleMapsLoader.js';

/**
 * Creates SVG Data URL for Google Map custom pin marker.
 */
function createMarkerIcon(number, color, labelText) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M20 46 C20 46 4 28 4 18 A16 16 0 0 1 36 18 C36 28 20 46 20 46 Z" fill="${color}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow)"/>
      <circle cx="20" cy="18" r="10.5" fill="#FFFFFF"/>
      <text x="20" y="22" font-size="12" font-weight="800" font-family="system-ui, -apple-system, sans-serif" fill="${color}" text-anchor="middle">${number}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Decodes Google encoded polyline points to Google LatLng literals { lat, lng }.
 */
function decodePolylinePath(encoded) {
  if (!encoded) return [];
  const path = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

/**
 * RouteMap Component (Google Maps Platform)
 *
 * Replaces Leaflet with Google Maps JavaScript API.
 * Renders:
 * - Interactive Google Road Map
 * - Distinct numbered start, intermediate, and final destination pin markers
 * - InfoWindows on marker click
 * - Google-calculated road route polyline following actual highway/road curves
 * - Automatic bounds fitting around markers and road polyline
 * - Synchronization on stop addition, removal, reordering
 * - Responsive resizing and fallback states
 */
export function RouteMap({
  stops = [],
  geometry = null,
  encodedPolyline = null,
  isStale = false,
  isCalculating = false,
  onRecalculate = null,
  apiError = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const infoWindowRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(isGoogleMapsLoaded());
  const [loadError, setLoadError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Listen for Google Maps auth failure
  useEffect(() => {
    const unsub = onGoogleMapsAuthFailure(() => {
      setAuthError(true);
    });
    return unsub;
  }, []);

  // Initialize Google Maps script
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadGoogleMaps();
        if (active) {
          setMapLoaded(true);
          setLoadError(null);
        }
      } catch (err) {
        if (active) {
          console.warn('[RouteMap] Could not load Google Maps JavaScript API:', err.message);
          setLoadError(err.message);
        }
      }
    }

    if (!isGoogleMapsLoaded()) {
      init();
    } else {
      setMapLoaded(true);
    }

    return () => {
      active = false;
    };
  }, []);

  // Initialize Map canvas once container and Google Maps are ready
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps || !containerRef.current) return;

    if (!mapRef.current) {
      const defaultCenter = { lat: 39.0, lng: 35.0 }; // Turkey center

      const map = new window.google.maps.Map(containerRef.current, {
        center: defaultCenter,
        zoom: 6,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9e2f4' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#f8c967' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#e9ac55' }],
          },
        ],
      });

      mapRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [mapLoaded]);

  // Synchronize Markers and Road Polyline
  const syncMapElements = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = mapRef.current;
    const gmaps = window.google.maps;

    // 1. Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 2. Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const validStops = (stops || []).filter(
      (s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)),
    );

    if (validStops.length === 0) return;

    const bounds = new gmaps.LatLngBounds();

    // 3. Render numbered stop markers
    validStops.forEach((stop, index) => {
      const isStart = index === 0;
      const isFinal = index === validStops.length - 1;
      const role = isStart ? 'START' : isFinal ? 'FINAL' : `STOP ${index}`;
      const color = isStart ? '#0C4E28' : isFinal ? '#FC7C00' : '#147D33';

      const position = {
        lat: Number(stop.latitude),
        lng: Number(stop.longitude),
      };

      bounds.extend(position);

      const marker = new gmaps.Marker({
        position,
        map,
        title: `${stop.name} (${role})`,
        icon: {
          url: createMarkerIcon(index + 1, color, role),
          scaledSize: new gmaps.Size(36, 44),
          anchor: new gmaps.Point(18, 44),
        },
        zIndex: isStart ? 100 : isFinal ? 99 : index + 10,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          const content = `
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 4px; min-width: 140px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 800; background: ${color}; color: #FFF; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em;">${role}</span>
                <span style="font-size: 11px; color: #66716B;">Stop #${index + 1}</span>
              </div>
              <strong style="font-size: 14.5px; color: #13291C; display: block; margin-bottom: 3px;">${stop.name}</strong>
              <div style="font-size: 11.5px; color: #56625B;">${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}</div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // 4. Render Google Road Polyline if route geometry is provided and not stale
    const polylineString = encodedPolyline || geometry?.encodedPolyline;
    let pathPoints = [];

    if (!isStale) {
      if (polylineString && gmaps.geometry?.encoding) {
        pathPoints = gmaps.geometry.encoding.decodePath(polylineString);
      } else if (polylineString) {
        pathPoints = decodePolylinePath(polylineString);
      } else if (geometry?.coordinates && Array.isArray(geometry.coordinates)) {
        // GeoJSON coordinates are [longitude, latitude]
        pathPoints = geometry.coordinates.map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
      }
    }

    if (pathPoints.length > 1) {
      pathPoints.forEach((pt) => bounds.extend(pt));

      const polyline = new gmaps.Polyline({
        path: pathPoints,
        geodesic: true,
        strokeColor: '#0C4E28',
        strokeOpacity: 0.88,
        strokeWeight: 5,
        map,
      });

      polylineRef.current = polyline;
    }

    // 5. Fit bounds with comfortable padding
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

      // Prevent over-zooming on a single point
      if (validStops.length === 1 && map.getZoom() > 11) {
        map.setZoom(11);
      }
    }
  }, [stops, geometry, encodedPolyline, isStale]);

  // Run synchronization whenever stops or geometry change
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      syncMapElements();
    }
  }, [mapLoaded, syncMapElements]);

  // Handle window resizing
  useEffect(() => {
    function handleResize() {
      if (mapRef.current && window.google?.maps) {
        window.google.maps.event.trigger(mapRef.current, 'resize');
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() - 1);
  };

  const handleResetBounds = () => {
    syncMapElements();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#E9E4DC',
        boxShadow: 'inset 0 0 0 1px #E2DCD1',
      }}
    >
      {/* Google Maps Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '480px',
        }}
      />

      {/* Floating Map Controls */}
      {mapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              width: '36px',
              height: '36px',
              background: '#FFFFFF',
              border: '1px solid #D5CDBF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#13291C',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <FiZoomIn size={17} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              width: '36px',
              height: '36px',
              background: '#FFFFFF',
              border: '1px solid #D5CDBF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#13291C',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <FiZoomOut size={17} />
          </button>
          <button
            type="button"
            onClick={handleResetBounds}
            title="Fit Entire Route"
            style={{
              width: '36px',
              height: '36px',
              background: '#FFFFFF',
              border: '1px solid #D5CDBF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0C4E28',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <FiMaximize2 size={16} />
          </button>
        </div>
      )}

      {/* Calculating Route Spinner Overlay */}
      {isCalculating && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 20,
          }}
        >
          <FiRefreshCw
            size={36}
            className="animate-spin"
            style={{ color: '#FC7C00' }}
          />
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#13291C' }}>
            Calculating Google Road Route...
          </div>
          <div style={{ fontSize: '13px', color: '#56625B' }}>
            Fetching real road geometry and metric travel times
          </div>
        </div>
      )}

      {/* Stale Route Overlay Badge */}
      {isStale && !isCalculating && onRecalculate && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#13291C',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '999px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '600',
            zIndex: 15,
            whiteSpace: 'nowrap',
          }}
        >
          <span>Route updated ·</span>
          <button
            type="button"
            onClick={onRecalculate}
            style={{
              background: '#FC7C00',
              border: 0,
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FiRefreshCw size={12} /> Recalculate
          </button>
        </div>
      )}

      {/* Missing or Unauthorized Google Maps Key State */}
      {(loadError || authError) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFBF3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            textAlign: 'center',
            zIndex: 5,
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FCE8E6',
              color: '#D93025',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiAlertCircle size={28} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#13291C' }}>
              Google Maps API Configuration Needed
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#56625B', maxWidth: '440px' }}>
              {authError
                ? 'Google Maps API authentication failed (gm_authFailure). Please verify that VITE_GOOGLE_MAPS_API_KEY is active and authorized for this domain.'
                : loadError || 'Set VITE_GOOGLE_MAPS_API_KEY in your frontend environment to render interactive Google Maps.'}
            </p>
          </div>

          {/* Visual Stops Fallback Cards */}
          {stops.length > 0 && (
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2DCD1',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0C4E28',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  letterSpacing: '0.05em',
                }}
              >
                Configured Stops ({stops.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stops.map((stop, i) => (
                  <div
                    key={stop.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#13291C' }}>
                      {i + 1}. {stop.name}
                    </span>
                    <span style={{ color: '#8A948F', fontSize: '12px' }}>
                      {Number(stop.latitude).toFixed(3)}, {Number(stop.longitude).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default RouteMap;
