export function RecommendedDays({ recommended, overridden, onOverride }) {
  return (
    <section aria-label="Recommended days">
      <h3>Recommended days</h3>
      <p>Recommended: {recommended ?? '—'}</p>
      <label>
        {' '}
        Override days
        <input
          type="number"
          min="1"
          max="365"
          value={overridden ?? ''}
          onChange={(e) => onOverride(e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
    </section>
  );
}
