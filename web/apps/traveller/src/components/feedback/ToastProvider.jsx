import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast } from './Toast.jsx';

const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export const toast = {
  show: (message, type = 'info', duration = 4000) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('qmt:toast', {
          detail: { message: String(message), type, duration, id: `${Date.now()}-${Math.random()}` },
        }),
      );
    }
  },
  success: (message, duration = 4000) => toast.show(message, 'success', duration),
  error: (message, duration = 5000) => toast.show(message, 'error', duration),
  warning: (message, duration = 4500) => toast.show(message, 'warning', duration),
  alert: (message, duration = 4500) => toast.show(message, 'warning', duration),
  info: (message, duration = 4000) => toast.show(message, 'info', duration),
};

export function useToast() {
  const ctx = useContext(ToastContext);
  return {
    ...ctx,
    toast,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    function handleEvent(e) {
      const { message, type = 'info', duration = 4000, id } = e.detail || {};
      if (!message) return;
      const toastId = id || Date.now() + Math.random();
      setToasts((prev) => [...prev, { id: toastId, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(toastId);
        }, duration);
      }
    }

    let originalAlert = null;
    if (typeof window !== 'undefined') {
      originalAlert = window.alert;
      window.alert = (alertMsg) => {
        showToast(String(alertMsg), 'warning', 4500);
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

  const value = {
    showToast,
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="tf-portal-toast-container" aria-live="polite">
        {toasts.map((item) => (
          <Toast
            key={item.id}
            message={item.message}
            type={item.type}
            onClose={() => removeToast(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
