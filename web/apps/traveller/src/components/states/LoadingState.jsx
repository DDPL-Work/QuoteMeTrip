import { Spinner } from '@troublefree/ui';

export function LoadingState({ message = 'Loading content...' }) {
  return (
    <div className="tf-portal-state-container">
      <Spinner size="lg" />
      <p style={{ marginTop: '16px', color: 'var(--tf-portal-text-muted)', fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
}
