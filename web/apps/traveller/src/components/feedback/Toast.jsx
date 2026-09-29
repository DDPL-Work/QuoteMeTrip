export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  return (
    <div className={`tf-portal-toast tf-portal-toast-${type}`} role="alert">
      <span>{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
          }}
          aria-label="Dismiss toast"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
