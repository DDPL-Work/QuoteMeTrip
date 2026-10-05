import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

export function AlertBanner({ type = 'info', message, onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const bg = isSuccess ? '#ECFDF5' : isError ? '#FEF2F2' : '#EFF6FF';
  const border = isSuccess ? '#A7F3D0' : isError ? '#FECACA' : '#BFDBFE';
  const textColor = isSuccess ? '#065F46' : isError ? '#991B1B' : '#1E40AF';
  const iconColor = isSuccess ? '#059669' : isError ? '#DC2626' : '#2563EB';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          color: textColor,
          fontSize: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {isSuccess ? (
            <FiCheckCircle style={{ color: iconColor, fontSize: '1.15rem', flexShrink: 0 }} />
          ) : (
            <FiAlertCircle style={{ color: iconColor, fontSize: '1.15rem', flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 500 }}>{message}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            style={{
              background: 'transparent',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.75,
            }}
          >
            <FiX />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
