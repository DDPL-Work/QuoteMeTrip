// Traveller Google sign-in button (Phase 3).
//
// Renders ONLY when a public Google client ID is configured
// (VITE_GOOGLE_CLIENT_ID). The provider ID token is verified
// server-side — the frontend never trusts the email on its own.
// Agency and Admin apps do not render this component at all.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context.js';
import { friendlyAuthMessage } from './friendly-message.js';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

function googleClientId() {
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '';
}

function loadGisScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (document.querySelector(`script[src="${GIS_SCRIPT}"]`)) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(timer);
        reject(new Error('Google sign-in failed to load. Please try again.'));
      }, 8000);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in failed to load. Please try again.'));
    document.head.appendChild(script);
  });
}

export function GoogleLoginButton({ onError }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const currentWidthRef = useRef(0);
  const [loadError, setLoadError] = useState('');
  const clientId = googleClientId();

  // Hooks run unconditionally; rendering is gated below so the
  // component stays invisible when Google is not configured.
  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    const renderButtonAtWidth = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      const measured =
        buttonRef.current.getBoundingClientRect?.().width ||
        buttonRef.current.offsetWidth ||
        buttonRef.current.parentElement?.offsetWidth ||
        0;

      // Google Identity Services renderButton accepts width between 200 and 400 pixels
      const targetWidth =
        measured > 0 ? Math.min(400, Math.max(200, Math.floor(measured))) : 300;
      currentWidthRef.current = targetWidth;

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: targetWidth,
      });
    };

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await googleLogin(response.credential);
              if (!cancelled) navigate('/', { replace: true });
            } catch (err) {
              if (!cancelled) {
                const message = friendlyAuthMessage(err);
                setLoadError(message);
                onError?.(message);
              }
            }
          },
        });

        renderButtonAtWidth();
      } catch (err) {
        if (!cancelled) {
          const message = friendlyAuthMessage(err);
          setLoadError(message);
        }
      }
    })();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.floor(entry.contentRect.width);
          if (w >= 200 && Math.abs(w - currentWidthRef.current) > 10) {
            renderButtonAtWidth();
          }
        }
      });
      if (buttonRef.current) {
        resizeObserver.observe(buttonRef.current);
      }
    }

    const handleWindowResize = () => {
      if (!buttonRef.current) return;
      const w =
        buttonRef.current.getBoundingClientRect?.().width ||
        buttonRef.current.offsetWidth ||
        0;
      if (w >= 200 && Math.abs(w - currentWidthRef.current) > 10) {
        renderButtonAtWidth();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [clientId, googleLogin, navigate, onError]);

  if (!clientId) return null;

  return (
    <div className="auth-social">
      <div className="auth-divider" aria-hidden="true">
        <span>or</span>
      </div>
      <div
        ref={buttonRef}
        data-testid="google-login-button"
        className="google-btn-container"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: '44px',
        }}
      />
      {loadError ? (
        <p className="auth-field-error" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
