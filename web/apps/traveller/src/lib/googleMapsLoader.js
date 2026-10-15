/**
 * Google Maps JavaScript API Singleton Loader
 *
 * Ensures Google Maps JS API and specified libraries (places, geometry)
 * are loaded once and shared across components and route transitions.
 * Listens for auth failures (gm_authFailure) to provide clear user feedback.
 */

let loadPromise = null;
let authFailed = false;
const authFailureListeners = new Set();

if (typeof window !== 'undefined') {
  const originalAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    authFailed = true;
    console.error(
      '[GoogleMapsLoader] Google Maps API authentication failed. Verify VITE_GOOGLE_MAPS_API_KEY, HTTP referrer restrictions, and API activation in Google Cloud Console.',
    );
    authFailureListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
    if (typeof originalAuthFailure === 'function') {
      originalAuthFailure();
    }
  };
}

export function onGoogleMapsAuthFailure(callback) {
  authFailureListeners.add(callback);
  if (authFailed) {
    callback();
  }
  return () => authFailureListeners.delete(callback);
}

export function isGoogleMapsLoaded() {
  return typeof window !== 'undefined' && Boolean(window.google?.maps);
}

export function loadGoogleMaps({
  apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || '',
  libraries = ['places', 'geometry'],
} = {}) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps cannot be loaded in a non-browser environment.'));
  }

  if (isGoogleMapsLoaded()) {
    return Promise.resolve(window.google.maps);
  }

  if (!apiKey) {
    return Promise.reject(
      new Error(
        'Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in your frontend environment.',
      ),
    );
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-js-api');
    if (existingScript) {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (err) => {
          loadPromise = null;
          reject(err);
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-api';
    script.async = true;
    script.defer = true;

    const callbackName = '__googleMapsInitCallback';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const libs = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}${libs}&loading=async&callback=${callbackName}`;

    script.onerror = (_err) => {
      delete window[callbackName];
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script from Google servers.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
