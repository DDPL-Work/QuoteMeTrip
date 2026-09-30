import React, { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiNavigation, FiRefreshCw } from 'react-icons/fi';

/**
 * RouteMap Component (Real OpenStreetMap Leaflet Map Integration)
 * Renders an interactive OpenStreetMap canvas with custom stop markers,
 * route polylines, automatic bounds fitting, and location popups.
 */
export function RouteMap({ stops = [], geometry = null, isStale = false, onRecalculate = null }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(typeof window !== 'undefined' && !!window.L);

  // Dynamically load Leaflet CSS & JS if not already available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapContainerRef.current || !stops || stops.length === 0) return;

    const L = window.L;

    // Destroy existing map instance to prevent re-initialization errors
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const validStops = stops.map((s) => ({
      ...s,
      lat: Number(s.latitude) || 38.9637,
      lng: Number(s.longitude) || 35.2433,
    }));

    const initialLat = validStops[0]?.lat || 38.9637;
    const initialLng = validStops[0]?.lng || 35.2433;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      leafletMapRef.current = map;

      // Add real OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Draw route polyline
      const latLngs = validStops.map((s) => [s.lat, s.lng]);
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#147D33',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);

        // Auto-fit bounds with padding
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [45, 45] });
      }

      // Add custom stop pin markers
      validStops.forEach((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === validStops.length - 1;
        const badgeColor = isFirst ? '#0C4E28' : isLast ? '#FC7C00' : '#147D33';
        const badgeLabel = isFirst ? 'START' : isLast ? 'FINAL' : `STOP ${idx}`;

        const iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${badgeColor};
            color: #FFFFFF;
            font-weight: 800;
            font-size: 13px;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-family: system-ui, sans-serif;
          ">
            ${idx + 1}
            <div style="
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              white-space: nowrap;
              background: rgba(19, 41, 28, 0.9);
              color: #FFF;
              padding: 2px 7px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">
              ${stop.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-route-marker',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px;">
            <strong style="color: #0C4E28; font-size: 14px; display: block;">${stop.name}</strong>
            <span style="font-size: 11px; color: #66716B;">${badgeLabel} (${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)})</span>
          </div>
        `);
      });
    } catch {
      // Gracefully handle map initialization in headless/test environments
    }

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {}
        leafletMapRef.current = null;
      }
    };
  }, [leafletLoaded, stops]);

  if (!stops || stops.length === 0) {
    return (
      <div
        style={{
          background: '#FFFBF3',
          border: '1px dashed #D5CDBF',
          borderRadius: '12px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#56625B',
          gap: '8px',
        }}
      >
        <FiNavigation size={32} style={{ color: '#147D33', opacity: 0.6 }} />
        <span style={{ fontSize: '14px', fontWeight: '600' }}>No route points selected</span>
        <span style={{ fontSize: '12px', color: '#66716B' }}>Add at least 2 destinations to generate your map preview</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: '1px solid #E2DCD1',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Stale Warning Header */}
      {isStale && (
        <div
          style={{
            background: '#FFF1DC',
            borderBottom: '1px solid #FCD34D',
            color: '#B45A00',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000,
          }}
        >
          <span>Route stops changed. Click Recalculate to update metrics.</span>
          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              style={{
                background: '#FC7C00',
                color: '#fff',
                border: 0,
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <FiRefreshCw size={12} /> Recalculate
            </button>
          )}
        </div>
      )}

      {/* Real Interactive OpenStreetMap Container */}
      <div style={{ position: 'relative', width: '100%', height: '440px' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', zIndex: 1, borderRadius: '14px 14px 0 0' }}
          aria-label={`Interactive OpenStreetMap route map from ${stops[0]?.name} to ${stops[stops.length - 1]?.name}`}
        />

        {/* Dynamic Loading Overlay */}
        {!leafletLoaded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#F4F1EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#147D33',
              fontWeight: '600',
              fontSize: '14px',
              zIndex: 2,
            }}
          >
            Loading OpenStreetMap...
          </div>
        )}
      </div>

      {/* Map Control Footer & Summary */}
      <div
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2DCD1',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#13291C', fontWeight: '700' }}>
          <FiMapPin style={{ color: '#147D33' }} size={16} />
          <span>
            {stops[0]?.name} → {stops[stops.length - 1]?.name} ({stops.length} destinations)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#56625B' }}>
          <span>{stops.map((s) => s.name).join(' • ')}</span>
          <span style={{ fontSize: '11px', background: '#E5F2EA', color: '#0C4E28', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
            OpenStreetMap Interactive
          </span>
        </div>
      </div>
    </div>
  );
}

export default RouteMap;
