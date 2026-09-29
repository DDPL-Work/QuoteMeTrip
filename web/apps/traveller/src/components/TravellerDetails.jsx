export function TravellerDetails({ profile }) {
  if (!profile) return <p>No profile loaded.</p>;
  const fullName = profile.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile.name || profile.fullName || '—';
  return (
    <section aria-label="Traveller details">
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}
      >
        <div>
          <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Full Name:</strong>
          <div>{fullName}</div>
        </div>
        <div>
          <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Email:</strong>
          <div>{profile.email ?? '—'}</div>
        </div>
        <div>
          <strong style={{ color: 'var(--tf-portal-text-muted)' }}>Phone / WhatsApp:</strong>
          <div>{profile.phone ?? 'Not specified'}</div>
        </div>
      </div>
    </section>
  );
}
