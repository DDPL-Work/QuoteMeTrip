export function AgencyDashboardSkeleton() {
  return (
    <div className="agency-dashboard-skeleton" data-testid="dashboard-skeleton">
      {/* Welcome Banner Skeleton */}
      <div
        className="agency-skeleton"
        style={{ height: '120px', borderRadius: '1rem', marginBottom: '2rem' }}
      />

      {/* KPI Cards Grid Skeleton */}
      <div className="agency-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="agency-skeleton"
            style={{ height: '110px', borderRadius: '1rem' }}
          />
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="agency-dashboard-grid">
        <div>
          <div
            className="agency-skeleton"
            style={{ height: '320px', borderRadius: '1rem', marginBottom: '1.5rem' }}
          />
        </div>
        <div>
          <div className="agency-skeleton" style={{ height: '320px', borderRadius: '1rem' }} />
        </div>
      </div>
    </div>
  );
}
