import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiSearch, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { isGoogleMapsLoaded, loadGoogleMaps } from '../lib/googleMapsLoader.js';

// Popular verified travel hubs for instant suggestion and offline fallback
export const POPULAR_TRAVEL_DESTINATIONS = [
  { name: 'Istanbul', formattedAddress: 'Istanbul, Turkey', latitude: 41.0082, longitude: 28.9784, placeId: 'ChIJgTwKgJcpXBURaJMi50lQKBg' },
  { name: 'Cappadocia', formattedAddress: 'Göreme, Nevşehir, Turkey', latitude: 38.6431, longitude: 34.8289, placeId: 'ChIJ9TfL7V_50hQRqQk3-oKq1a0' },
  { name: 'Antalya', formattedAddress: 'Antalya, Turkey', latitude: 36.8969, longitude: 30.7133, placeId: 'ChIJyc2U947_wBQRr9kF2x-X5e8' },
  { name: 'Bodrum', formattedAddress: 'Bodrum, Muğla, Turkey', latitude: 37.0344, longitude: 27.4305, placeId: 'ChIJz2xGZtMavxQRvL97q-9uU6A' },
  { name: 'Fethiye', formattedAddress: 'Fethiye, Muğla, Turkey', latitude: 36.6217, longitude: 29.1164, placeId: 'ChIJV4qYV1eFuxQR6nK1aF6n1q0' },
  { name: 'Izmir', formattedAddress: 'Izmir, Turkey', latitude: 38.4237, longitude: 27.1428, placeId: 'ChIJm7_fM6RrvxQRc9i19H2G_jI' },
  { name: 'Pamukkale', formattedAddress: 'Pamukkale, Denizli, Turkey', latitude: 37.9204, longitude: 29.1213, placeId: 'ChIJl7x3r_j8uxQRWl9fQz9L9e0' },
  { name: 'Ephesus', formattedAddress: 'Selçuk, Izmir, Turkey', latitude: 37.9485, longitude: 27.3681, placeId: 'ChIJpQ31bX1uvxQRDV_c-q3Z2rM' },
  { name: 'Trabzon', formattedAddress: 'Trabzon, Turkey', latitude: 41.0027, longitude: 39.7168, placeId: 'ChIJ9X0p4hRzPRQR36eI8tqF4-Y' },
  { name: 'Ankara', formattedAddress: 'Ankara, Turkey', latitude: 39.9334, longitude: 32.8597, placeId: 'ChIJixDE5NSt0xQRk5-8xY5k_iU' },
  { name: 'Bursa', formattedAddress: 'Bursa, Turkey', latitude: 40.1885, longitude: 29.0610, placeId: 'ChIJb6lU0Q9QvBQR2n-8b_G8Y7Q' },
  { name: 'Konya', formattedAddress: 'Konya, Turkey', latitude: 37.8746, longitude: 32.4932, placeId: 'ChIJT0371Z7g0RQRZ3u5XfB8X9Y' },
  { name: 'Marmaris', formattedAddress: 'Marmaris, Muğla, Turkey', latitude: 36.8550, longitude: 28.2742, placeId: 'ChIJJT1J-7_uvxQRh6r-q74iO1Y' },
  { name: 'Kas', formattedAddress: 'Kaş, Antalya, Turkey', latitude: 36.2003, longitude: 29.6377, placeId: 'ChIJ22Pz5YqLuxQRfR8P3l8L7bY' },
  { name: 'Alanya', formattedAddress: 'Alanya, Antalya, Turkey', latitude: 36.5438, longitude: 31.9998, placeId: 'ChIJjQk21m7pwBQR39E6L5_yY7g' },
  { name: 'Canakkale', formattedAddress: 'Çanakkale, Turkey', latitude: 40.1553, longitude: 26.4142, placeId: 'ChIJvT2q0XvfvRQRfB-M8O3E6W0' },
  { name: 'Gaziantep', formattedAddress: 'Gaziantep, Turkey', latitude: 37.0662, longitude: 37.3833, placeId: 'ChIJoQWc9vR70hQRn0_P3M6E8X8' },
  { name: 'Mardin', formattedAddress: 'Mardin, Turkey', latitude: 37.3129, longitude: 40.7350, placeId: 'ChIJp3Qz_bVj0hQRx6F8r3X4Y5M' },
  { name: 'Rize', formattedAddress: 'Rize, Turkey', latitude: 41.0201, longitude: 40.5234, placeId: 'ChIJfYpM2v_BPRQRn1g8O5q2W0s' },
];

export function DestinationAutocomplete({
  value = '',
  onChange = () => {},
  onSelect = () => {},
  placeholder = 'Search city or destination (e.g. Istanbul, Bodrum)...',
  disabled = false,
}) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Places services if Google Maps is available
  useEffect(() => {
    let active = true;

    async function initPlaces() {
      try {
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMaps().catch(() => {});
        }
        if (active && window.google?.maps?.places) {
          if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          }
          if (!geocoderRef.current) {
            geocoderRef.current = new window.google.maps.Geocoder();
          }
          if (!placesServiceRef.current) {
            const dummyElem = document.createElement('div');
            placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElem);
          }
        }
      } catch {
        // Fallback to presets
      }
    }

    initPlaces();
    return () => {
      active = false;
    };
  }, []);

  // Dismiss dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with 300ms debounce
  const fetchSuggestions = (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (autocompleteServiceRef.current && window.google?.maps?.places) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            types: ['(cities)'],
          },
          (predictions, status) => {
            setLoading(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              Array.isArray(predictions) &&
              predictions.length > 0
            ) {
              const formatted = predictions.map((p) => ({
                id: p.place_id,
                placeId: p.place_id,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || '',
                description: p.description,
                isGoogle: true,
              }));
              setSuggestions(formatted);
              setIsOpen(true);
            } else {
              // Try fallback matches
              searchLocalPresets(query);
            }
          },
        );
        return;
      } catch (err) {
        console.warn('[DestinationAutocomplete] Places autocomplete error, using fallback:', err);
      }
    }

    searchLocalPresets(query);
  };

  const searchLocalPresets = (query) => {
    setLoading(false);
    const q = query.toLowerCase().trim();
    const matches = POPULAR_TRAVEL_DESTINATIONS.filter(
      (dest) =>
        dest.name.toLowerCase().includes(q) || dest.formattedAddress.toLowerCase().includes(q),
    ).map((dest) => ({
      id: dest.placeId || dest.name,
      placeId: dest.placeId,
      mainText: dest.name,
      secondaryText: dest.formattedAddress,
      description: dest.formattedAddress,
      latitude: dest.latitude,
      longitude: dest.longitude,
      isGoogle: false,
    }));

    setSuggestions(matches);
    setIsOpen(matches.length > 0);
  };

  const handleInputChange = (e) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);
    onChange(nextVal);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(nextVal);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setIsOpen(false);
    setInputValue(suggestion.mainText);
    onChange(suggestion.mainText);

    // If coordinates already resolved from presets
    if (suggestion.latitude && suggestion.longitude) {
      onSelect({
        name: suggestion.mainText,
        formattedAddress: suggestion.secondaryText,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        placeId: suggestion.placeId,
      });
      return;
    }

    // Resolve coordinates via Google PlacesService or Geocoder
    if (suggestion.placeId && (placesServiceRef.current || geocoderRef.current)) {
      setLoading(true);
      if (placesServiceRef.current) {
        placesServiceRef.current.getDetails(
          {
            placeId: suggestion.placeId,
            fields: ['geometry', 'name', 'formatted_address'],
          },
          (place, status) => {
            setLoading(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place?.geometry?.location
            ) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              onSelect({
                name: suggestion.mainText,
                formattedAddress: place.formatted_address || suggestion.description,
                latitude: Number(lat.toFixed(5)),
                longitude: Number(lng.toFixed(5)),
                placeId: suggestion.placeId,
              });
            } else {
              geocodeFallback(suggestion);
            }
          },
        );
        return;
      }
    }

    geocodeFallback(suggestion);
  };

  const geocodeFallback = (suggestion) => {
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ address: suggestion.description }, (results, status) => {
        setLoading(false);
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          onSelect({
            name: suggestion.mainText,
            formattedAddress: results[0].formatted_address,
            latitude: Number(loc.lat().toFixed(5)),
            longitude: Number(loc.lng().toFixed(5)),
            placeId: results[0].place_id || suggestion.placeId,
          });
        } else {
          // Last resort fallback
          const preset = POPULAR_TRAVEL_DESTINATIONS.find(
            (p) => p.name.toLowerCase() === suggestion.mainText.toLowerCase(),
          );
          if (preset) {
            onSelect(preset);
          }
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        <FiMapPin
          style={{
            position: 'absolute',
            left: '12px',
            color: '#147D33',
            fontSize: '17px',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim().length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          style={{
            width: '100%',
            padding: '12px 36px 12px 38px',
            borderRadius: '10px',
            border: '1px solid #D5CDBF',
            fontSize: '14.5px',
            outline: 'none',
            background: '#FFFFFF',
            color: '#13291C',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {loading ? (
          <FiLoader
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '12px',
              color: '#8A948F',
              fontSize: '16px',
            }}
          />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear destination"
            style={{
              position: 'absolute',
              right: '8px',
              border: 0,
              background: 'transparent',
              color: '#8A948F',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
            }}
          >
            <FiX size={16} />
          </button>
        ) : null}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2DCD1',
            boxShadow: '0 12px 32px rgba(19, 41, 28, 0.12)',
            maxHeight: '280px',
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: '6px',
            zIndex: 1000,
          }}
        >
          {suggestions.map((item, index) => {
            const isHighlighted = highlightedIndex === index;
            return (
              <li
                key={item.id || index}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isHighlighted ? '#E5F2EA' : 'transparent',
                  color: isHighlighted ? '#0C4E28' : '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'background 0.15s ease',
                }}
              >
                <FiMapPin
                  style={{
                    color: isHighlighted ? '#0C4E28' : '#147D33',
                    marginTop: '3px',
                    flexShrink: 0,
                  }}
                  size={15}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.mainText}
                  </div>
                  {item.secondaryText && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: isHighlighted ? '#147D33' : '#66716B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {item.secondaryText}
                    </div>
                  )}
                </div>
                {item.isGoogle && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: '700',
                      background: '#F0ECE1',
                      color: '#4E5754',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      alignSelf: 'center',
                    }}
                  >
                    Google
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
export default DestinationAutocomplete;
