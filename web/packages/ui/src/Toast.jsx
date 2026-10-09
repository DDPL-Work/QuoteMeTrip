import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from 'react-icons/fi';

const ToastContext = createContext(null);

/**
 * Universal toast trigger utility that works anywhere in application code
 * (inside or outside of React component lifecycle).
 */
export const toast = {
  show: (message, type = 'info', duration = 4500) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('qmt:toast', {
          detail: { message: String(message), type, duration, id: `${Date.now()}-${Math.random()}` },
        }),
      );
    }
  },
  success: (message, duration = 4500) => toast.show(message, 'success', duration),
  error: (message, duration = 5500) => toast.show(message, 'error', duration),
  warning: (message, duration = 5000) => toast.show(message, 'warning', duration),
  alert: (message, duration = 5000) => toast.show(message, 'warning', duration),
  info: (message, duration = 4500) => toast.show(message, 'info', duration),
};

export function useToast() {
  const context = useContext(ToastContext);
  if (context) {
    return context;
  }
  // Safe fallback if called outside ToastProvider
  return {
    showToast: toast.show,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    toast,
  };
}

const TOAST_THEMES = {
  success: {
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#166534',
    iconColor: '#16a34a',
    Icon: FiCheckCircle,
    badgeBg: '#dcfce7',
    badgeText: 'SUCCESS',
  },
  error: {
    bg: '#fef2f2',
    border: '#fca5a5',
    color: '#991b1b',
    iconColor: '#dc2626',
    Icon: FiAlertCircle,
    badgeBg: '#fee2e2',
    badgeText: 'ERROR',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde047',
    color: '#854d0e',
    iconColor: '#d97706',
    Icon: FiAlertTriangle,
    badgeBg: '#fef3c7',
    badgeText: 'ALERT',
  },
  info: {
    bg: '#f0f9ff',
    border: '#7dd3fc',
    color: '#075985',
    iconColor: '#0284c7',
    Icon: FiInfo,
    badgeBg: '#e0f2fe',
    badgeText: 'NOTICE',
  },
};

function ToastItem({ id, message, type = 'info', onClose }) {
  const theme = TOAST_THEMES[type] || TOAST_THEMES.info;
  const Icon = theme.Icon;

  return (
    <div
      role="alert"
      className="qmt-top-right-toast"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
        color: theme.color,
        fontSize: '0.88rem',
        lineHeight: 1.45,
        position: 'relative',
        overflow: 'hidden',
        animation: 'qmtToastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        <Icon style={{ fontSize: '1.25rem', color: theme.iconColor }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: theme.badgeBg,
              color: theme.color,
              letterSpacing: '0.05em',
            }}
          >
            {theme.badgeText}
          </span>
        </div>
        <div style={{ wordBreak: 'break-word', fontWeight: 500 }}>
          {message}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        aria-label="Close notification"
        style={{
          background: 'none',
          border: 'none',
          color: theme.color,
          opacity: 0.65,
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.05rem',
          flexShrink: 0,
          marginTop: '1px',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
      >
        <FiX />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Global event listener for toast events across the app
  useEffect(() => {
    function handleEvent(e) {
      const { message, type = 'info', duration = 4500, id } = e.detail || {};
      if (!message) return;
      const toastId = id || `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id: toastId, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(toastId);
        }, duration);
      }
    }

    // Intercept native window.alert so any alert() call renders as a top-right toaster
    let originalAlert = null;
    if (typeof window !== 'undefined') {
      originalAlert = window.alert;
      window.alert = (alertMsg) => {
        showToast(String(alertMsg), 'warning', 5000);
      };
    }

    window.addEventListener('qmt:toast', handleEvent);
    return () => {
      window.removeEventListener('qmt:toast', handleEvent);
      if (typeof window !== 'undefined' && originalAlert) {
        window.alert = originalAlert;
      }
    };
  }, [removeToast, showToast]);

  const contextValue = {
    showToast,
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    toast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Global Top-Right Toast Container */}
      <div
        className="qmt-toast-container"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        <style>
          {`
            @keyframes qmtToastSlideIn {
              from {
                transform: translateX(110%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
