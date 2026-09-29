export function RouteStopItem({ stop, index, isFirst, isLast, onRemove, onMoveUp, onMoveDown }) {
  return (
    <li>
      <span>
        {index + 1}. {stop.name} [{stop.type}]
      </span>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label={`Move ${stop.name} up`}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label={`Move ${stop.name} down`}
      >
        ↓
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${stop.name}`}>
        Remove
      </button>
    </li>
  );
}
