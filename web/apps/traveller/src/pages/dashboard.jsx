import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context.js';
import { useI18n } from '@troublefree/i18n';
import { Icons } from '../components/icons.jsx';
import { useTravellerDashboard } from '../features/dashboard/useTravellerDashboard.js';
import {
  Button,
  StatusBadge,
  Skeleton,
  EmptyState,
  ErrorState,
  Card,
  IconButton,
  Spinner,
} from '@troublefree/ui';

import { HeroIllustration } from '../components/illustrations/HeroIllustration.jsx';
import { ItineraryIllustration } from '../components/illustrations/ItineraryIllustration.jsx';
import { QuotationIllustration } from '../components/illustrations/QuotationIllustration.jsx';
import { PaymentIllustration } from '../components/illustrations/PaymentIllustration.jsx';
import { RouteIllustration } from '../components/illustrations/RouteIllustration.jsx';

import { MotionPage } from '../components/motion/MotionPage.jsx';
import { MotionReveal } from '../components/motion/MotionReveal.jsx';
import { StaggerContainer } from '../components/motion/StaggerContainer.jsx';

// Simple time-of-day logic
function getTimeOfDay(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.welcome.time.morning');
  if (hour < 18) return t('dashboard.welcome.time.afternoon');
  return t('dashboard.welcome.time.evening');
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data, loading, error, actions } = useTravellerDashboard();

  const { requests, jobs, conversations, quotations, unreadNotifications, draftRequest } = data;

  // Combine loading state
  const isInitialLoading =
    loading.requests && loading.jobs && loading.conversations && loading.notifications;
  const hasErrors = error.requests || error.jobs || error.conversations;

  // Next action logic
  let actionTitle = t('dashboard.action.empty.title');
  let actionDesc = t('dashboard.action.empty.desc');
  let actionBtn = t('dashboard.action.empty.btn');
  let actionLink = '/plan-trip';

  if (draftRequest) {
    actionTitle = t('dashboard.action.draft.title');
    actionDesc = t('dashboard.action.draft.desc');
    actionBtn = t('dashboard.action.draft.btn');
    actionLink = `/travel-requests/${draftRequest.id}`;
  } else if (jobs.length > 0) {
    actionTitle = t('dashboard.action.job.title');
    actionDesc = t('dashboard.action.job.desc');
    actionBtn = t('dashboard.action.job.btn');
    actionLink = `/jobs/${jobs[0].id}`;
  } else if (quotations.length > 0) {
    actionTitle = t('dashboard.action.quote.title');
    actionDesc = t('dashboard.action.quote.desc');
    actionBtn = t('dashboard.action.quote.btn');
    actionLink = `/travel-requests`; // or specific quote
  }

  const welcomeTime = getTimeOfDay(t);
  const firstName = user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveller';
  const welcomeText = t('dashboard.welcome', { timeOfDay: welcomeTime, name: firstName })
    .replace('{timeOfDay}', welcomeTime)
    .replace('{name}', firstName);

  if (isInitialLoading) {
    return (
      <main className="tf-portal-main">
        <header className="tf-portal-page-header">
          <Skeleton height="36px" width="300px" />
          <Skeleton height="20px" width="200px" style={{ marginTop: '8px' }} />
        </header>
        <div
          className="dashboard-grid"
          style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            margin: '20px 0',
          }}
        >
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
      </main>
    );
  }

  return (
    <MotionPage>
      <main
        className="tf-portal-main"
        style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}
      >
      {/* Top Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13.5px', color: '#56625B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/" style={{ color: '#147D33', fontWeight: '700', textDecoration: 'none' }}>
            🌐 Public Portal
          </Link>
          <span>/</span>
          <span style={{ fontWeight: '600', color: '#13291C' }}>Dashboard</span>
        </div>
        <Link to="/" style={{ color: '#0C4E28', fontWeight: '700', fontSize: '13px', background: '#E5F2EA', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none' }}>
          Explore Portal Home →
        </Link>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F3DCC2' }}>
        <HeroIllustration style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(243,220,194,0.95) 0%, rgba(243,220,194,0.6) 50%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <h1 className="tf-portal-page-title" style={{ color: '#13291C', margin: 0, fontSize: '2rem' }}>{welcomeText}</h1>
            <p className="tf-portal-page-subtitle" style={{ color: '#13291C', margin: '8px 0 0', opacity: 0.8 }}>{t('dashboard.planNextTrip')}</p>
          </div>
          <div>
            <Button variant="line" onClick={actions.refreshAll} aria-label={t('dashboard.refresh')} style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: 'none' }}>
              <Icons.Refresh aria-hidden="true" style={{ marginRight: '8px' }} />
              {t('dashboard.refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Action Card */}
      <section
        className="tf-card tf-card-default"
        style={{
          margin: '24px 0',
          borderLeft: '4px solid var(--tf-portal-orange)',
          background: 'var(--tf-portal-surface-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2>{actionTitle}</h2>
          <p style={{ color: 'var(--tf-portal-text-muted)', marginBottom: '16px' }}>{actionDesc}</p>
          <Link to={actionLink} className="tf-btn tf-btn-primary tf-btn-md">
            {actionBtn}
          </Link>
        </div>
        <div style={{ width: '200px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', opacity: 0.9 }}>
          <RouteIllustration kind="balloons" style={{ width: '150px' }} />
        </div>
      </section>

      {/* Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <SummaryCard
          count={requests.length}
          label={t('dashboard.summary.requests')}
          loading={loading.requests}
          link="/travel-requests"
        />
        <SummaryCard
          count={quotations.length}
          label={t('dashboard.summary.quotations')}
          loading={loading.requests}
          link="/travel-requests"
        />
        <SummaryCard
          count={jobs.length}
          label={t('dashboard.summary.jobs')}
          loading={loading.jobs}
          link="/jobs"
        />
        <SummaryCard
          count={conversations.length}
          label={t('dashboard.summary.messages')}
          loading={loading.conversations}
          link="/messages"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Recent Requests */}
        <DashboardSection
          title={t('dashboard.section.requests')}
          link="/travel-requests"
          linkText={t('dashboard.viewAll')}
          loading={loading.requests}
          error={error.requests}
          onRetry={actions.fetchRequests}
        >
          {requests.length === 0 ? (
            <EmptyState title={t('dashboard.empty.requests')} icon={<ItineraryIllustration style={{ width: '150px' }} />} />
          ) : (
            <ul className="tf-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {requests.slice(0, 3).map((req) => (
                <li
                  key={req.id}
                  className="tf-card"
                  style={{ marginBottom: '12px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Route: {req.route?.title || 'Custom Trip'}</strong>
                    <StatusBadge status={req.status} label={t(`status.${req.status}`)} />
                  </div>
                  <p
                    style={{
                      margin: '8px 0',
                      color: 'var(--tf-portal-text-muted)',
                      fontSize: '0.9em',
                    }}
                  >
                    Request #{req.id} • {req.Quotations?.length || 0} quotations
                  </p>
                  <Link
                    to={`/travel-requests/${req.id}`}
                    className="tf-btn tf-btn-line tf-btn-sm"
                    style={{ marginTop: '8px' }}
                  >
                    View Request
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        {/* Active Jobs */}
        <DashboardSection
          title={t('dashboard.section.jobs')}
          link="/jobs"
          linkText={t('dashboard.viewAll')}
          loading={loading.jobs}
          error={error.jobs}
          onRetry={actions.fetchJobs}
        >
          {jobs.length === 0 ? (
            <EmptyState title={t('dashboard.empty.jobs')} icon={<PaymentIllustration style={{ width: '150px' }} />} />
          ) : (
            <ul className="tf-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {jobs.slice(0, 3).map((job) => (
                <li
                  key={job.id}
                  className="tf-card"
                  style={{ marginBottom: '12px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Trip #{job.id}</strong>
                    <StatusBadge status={job.status} label={t(`status.${job.status}`)} />
                  </div>
                  <p
                    style={{
                      margin: '8px 0',
                      color: 'var(--tf-portal-text-muted)',
                      fontSize: '0.9em',
                    }}
                  >
                    Agency: {job.agency?.agencyName || 'Verified Agency'}
                  </p>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="tf-btn tf-btn-line tf-btn-sm"
                    style={{ marginTop: '8px' }}
                  >
                    View Trip
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        {/* Recent Messages */}
        <DashboardSection
          title={t('dashboard.section.messages')}
          link="/messages"
          linkText={t('dashboard.viewAll')}
          loading={loading.conversations}
          error={error.conversations}
          onRetry={actions.fetchConversations}
        >
          {conversations.length === 0 ? (
            <EmptyState title={t('dashboard.empty.messages')} icon={<QuotationIllustration style={{ width: '150px' }} />} />
          ) : (
            <ul className="tf-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {conversations.slice(0, 3).map((conv) => (
                <li
                  key={conv.id}
                  className="tf-card"
                  style={{
                    marginBottom: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>
                      {conv.agency?.agencyName || `Conversation #${conv.id}`}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85em',
                        color: 'var(--tf-portal-text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px',
                      }}
                    >
                      {conv.lastMessage?.body || 'No messages yet'}
                    </p>
                  </div>
                  <Link to={`/messages/${conv.id}`} className="tf-btn tf-btn-line tf-btn-sm">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>
    </main>
    </MotionPage>
  );
}

// Subcomponents
function SummaryCard({ count, label, loading, link }) {
  return (
    <div className="tf-card" style={{ padding: '20px', textAlign: 'center' }}>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--tf-portal-green)',
            lineHeight: 1,
          }}
        >
          {count}
        </div>
      )}
      <div style={{ marginTop: '8px', color: 'var(--tf-portal-text-muted)' }}>{label}</div>
      {link && !loading && (
        <Link
          to={link}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '0.9em',
            textDecoration: 'none',
            color: 'var(--tf-portal-orange)',
          }}
        >
          View <Icons.ArrowRight aria-hidden="true" style={{ marginLeft: '4px' }} />
        </Link>
      )}
    </div>
  );
}

function DashboardSection({ title, children, link, linkText, loading, error, onRetry }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        {link && (
          <Link
            to={link}
            style={{ fontSize: '0.9em', textDecoration: 'none', color: 'var(--tf-portal-green)' }}
          >
            {linkText}
          </Link>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div>
            <Skeleton height="80px" style={{ marginBottom: '12px' }} />
            <Skeleton height="80px" style={{ marginBottom: '12px' }} />
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={onRetry} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
