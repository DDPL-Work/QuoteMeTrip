import { RouteStopItem } from './RouteStopItem.jsx';

export function RouteStopList({ stops, onRemove, onMove }) {
  return (
    <section aria-label="Route stops">
      <h3>Stops ({stops.length})</h3>
      {stops.length === 0 ? (
        <p>No stops added.</p>
      ) : (
        <ol>
          {stops.map((stop, index) => (
            <RouteStopItem
              key={stop.id ?? index}
              stop={stop}
              index={index}
              isFirst={index === 0}
              isLast={index === stops.length - 1}
              onRemove={() => onRemove(stop.id)}
              onMoveUp={() => onMove(index, index - 1)}
              onMoveDown={() => onMove(index, index + 1)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
