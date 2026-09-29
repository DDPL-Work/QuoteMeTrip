// SVG/list fallback for the calculated route. No external map SDK.

export function RouteMap({ stops = [], geometry = null }) {
  const points = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates.map((c) => (Array.isArray(c) ? { x: c[0], y: c[1] } : c))
    : stops.map((s, i) => ({ x: i * 60 + 20, y: 60 }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <section aria-label="Route map">
      <h3>Route map</h3>
      {points.length === 0 ? (
        <p>No stops yet.</p>
      ) : (
        <svg width="100%" height="120" role="img" aria-label="Route polyline">
          <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" />
          ))}
        </svg>
      )}
      <ol>
        {stops.map((s, i) => (
          <li key={s.id ?? i}>
            {s.name} ({s.latitude}, {s.longitude})
          </li>
        ))}
      </ol>
    </section>
  );
}
