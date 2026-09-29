import { Skeleton as UISkeleton } from '@troublefree/ui';

export function Skeleton({
  height = '20px',
  width = '100%',
  borderRadius = '6px',
  className = '',
}) {
  return (
    <UISkeleton height={height} width={width} borderRadius={borderRadius} className={className} />
  );
}

export function CardSkeleton() {
  return (
    <div className="tf-card tf-portal-stack">
      <Skeleton height="24px" width="40%" />
      <Skeleton height="16px" width="80%" />
      <Skeleton height="16px" width="60%" />
    </div>
  );
}
