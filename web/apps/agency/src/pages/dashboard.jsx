import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiInbox,
  FiEye,
  FiFileText,
  FiBriefcase,
  FiArrowRight,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { AgencyDashboardSkeleton } from '../components/AgencyDashboardSkeleton.jsx';
import { AgencyRequestCard } from '../components/AgencyRequestCard.jsx';
import { useAuth } from '../features/auth/auth-context.js';
import { useI18n } from '@troublefree/i18n';
import { toast } from '@troublefree/ui';
import { agencyRequestApi, agencyQuotationApi, jobApi, messagingApi } from '../lib/api.js';

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [counts, setCounts] = useState({
    inbox: 0,
    newRequests: 0,
    viewedRequests: 0,
    quotations: 0,
    jobs: 0,
    conversations: 0,
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const agencyName =
    user?.agencyName ?? user?.companyName ?? user?.name ?? user?.email?.split('@')[0] ?? 'Agency';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    async function safeFetch(apiFn) {
      try {
        if (!apiFn) return null;
        return await Promise.resolve(apiFn());
      } catch {
        return null;
      }
    }

    try {
      const [requestsRes, quotesRes, jobsRes, conversationsRes] = await Promise.allSettled([
        agencyRequestApi.list({ pageSize: 5 }),
        safeFetch(() => agencyQuotationApi.list()),
        safeFetch(() => jobApi.list()),
        safeFetch(() => messagingApi.listConversations({ page: 1, pageSize: 5 })),
      ]);

      if (requestsRes.status === 'rejected') {
        throw requestsRes.reason ?? new Error('Unable to load agency dashboard.');
      }

      let reqList = [];
      let totalReqs = 0;
      let newCount = 0;
      let viewedCount = 0;

      if (requestsRes.status === 'fulfilled' && requestsRes.value) {
        const data = requestsRes.value;
        reqList = data?.requests ?? data?.data ?? (Array.isArray(data) ? data : []);
        totalReqs = data?.pagination?.totalItems ?? reqList.length;

        // Derive status counts safely
        newCount = reqList.filter(
          (r) => (r.matchStatus ?? r.match?.matchStatus) === 'matched',
        ).length;
        viewedCount = reqList.filter(
          (r) => (r.matchStatus ?? r.match?.matchStatus) === 'viewed',
        ).length;

        setRecentRequests(reqList.slice(0, 5));
      }

      let quoteTotal = 0;
      if (quotesRes.status === 'fulfilled' && quotesRes.value) {
        const quotes = quotesRes.value?.quotations ?? quotesRes.value ?? [];
        quoteTotal = Array.isArray(quotes) ? quotes.length : 0;
      }

      let jobTotal = 0;
      if (jobsRes.status === 'fulfilled' && jobsRes.value) {
        const jobs = jobsRes.value?.jobs ?? jobsRes.value ?? [];
        jobTotal = Array.isArray(jobs) ? jobs.length : 0;
      }

      let convTotal = 0;
      if (conversationsRes.status === 'fulfilled' && conversationsRes.value) {
        const convs = conversationsRes.value?.conversations ?? conversationsRes.value ?? [];
        convTotal =
          conversationsRes.value?.pagination?.totalItems ??
          (Array.isArray(convs) ? convs.length : 0);
      }

      setCounts({
        inbox: totalReqs,
        newRequests: typeof newCount === 'number' ? newCount : 0,
        viewedRequests: viewedCount,
        quotations: quoteTotal,
        jobs: jobTotal,
        conversations: convTotal,
      });

      // Build activity stream from actual requests
      const activityStream = reqList.map((r) => ({
        id: r.id,
        title: `Matched request for ${r.destination ?? 'destination'}`,
        timestamp: r.createdAt ?? r.updatedAt ?? new Date().toISOString(),
        type: 'request',
      }));
      setRecentActivity(activityStream.slice(0, 4));
    } catch (e) {
      const msg = e?.message ?? 'Unable to load agency dashboard.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Greeting based on hour
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greetingText = `Good ${timeOfDay}`;

  return (
    <AgencyAppLayout activeItem="dashboard" unreadRequestsCount={counts.newRequests}>
      {loading ? (
        <AgencyDashboardSkeleton />
      ) : error ? (
        <div className="agency-error-state" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiAlertCircle style={{ fontSize: '1.5rem' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '1rem' }}>{error}</strong>
              <span style={{ fontSize: '0.85rem' }}>Failed to retrieve your dashboard data.</span>
            </div>
          </div>
          <button
            type="button"
            className="agency-btn agency-btn-secondary"
            onClick={loadDashboardData}
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      ) : (
        <>
          {/* Welcome Banner */}
          <section className="agency-dashboard-header">
            <div className="agency-welcome-banner">
              <h1 className="agency-welcome-title">
                {greetingText}, {agencyName}
              </h1>
              <p className="agency-welcome-subtitle">
                Manage your incoming travel requests, review client opportunities, and process
                quotations.
              </p>
            </div>
          </section>

          {/* KPI Summary Cards */}
          <section className="agency-kpi-grid">
            <motion.div
              className="agency-kpi-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="agency-kpi-top">
                <span className="agency-kpi-label">New Requests</span>
                <div className="agency-kpi-icon-wrap agency-kpi-icon-orange">
                  <FiInbox />
                </div>
              </div>
              <div className="agency-kpi-value">{counts.inbox}</div>
              <div className="agency-kpi-subtitle">Waiting for agency review</div>
            </motion.div>

            <motion.div
              className="agency-kpi-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="agency-kpi-top">
                <span className="agency-kpi-label">Viewed Requests</span>
                <div className="agency-kpi-icon-wrap agency-kpi-icon-green">
                  <FiEye />
                </div>
              </div>
              <div className="agency-kpi-value">{counts.viewedRequests}</div>
              <div className="agency-kpi-subtitle">Reviewed opportunities</div>
            </motion.div>

            <motion.div
              className="agency-kpi-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="agency-kpi-top">
                <span className="agency-kpi-label">My Quotations</span>
                <div className="agency-kpi-icon-wrap agency-kpi-icon-blue">
                  <FiFileText />
                </div>
              </div>
              <div className="agency-kpi-value">{counts.quotations}</div>
              <div className="agency-kpi-subtitle">Submitted client offers</div>
            </motion.div>

            <motion.div
              className="agency-kpi-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="agency-kpi-top">
                <span className="agency-kpi-label">Active Jobs</span>
                <div className="agency-kpi-icon-wrap agency-kpi-icon-purple">
                  <FiBriefcase />
                </div>
              </div>
              <div className="agency-kpi-value">{counts.jobs}</div>
              <div className="agency-kpi-subtitle">Accepted travel bookings</div>
            </motion.div>
          </section>

          {/* Main Dashboard Layout */}
          <div className="agency-dashboard-grid">
            {/* Left Main Column: Priority New Requests */}
            <div>
              <div className="agency-section-card">
                <div className="agency-section-header">
                  <h2 className="agency-section-title">
                    <FiInbox style={{ color: 'var(--agency-secondary)' }} />
                    Matched Travel Requests
                  </h2>
                  <Link to="/requests" className="agency-section-link">
                    View all requests <FiArrowRight />
                  </Link>
                </div>

                {recentRequests.length === 0 ? (
                  <div className="agency-empty-state">
                    <FiInbox className="agency-empty-icon" />
                    <h3 className="agency-empty-title">No incoming requests yet</h3>
                    <p className="agency-empty-subtitle">
                      When matched travel requests arrive from travellers in your region, they will
                      appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="agency-requests-stack">
                    {recentRequests.map((req) => (
                      <AgencyRequestCard
                        key={req.id}
                        request={req}
                        isNew={(req.matchStatus ?? req.match?.matchStatus) === 'matched'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quick Actions & Activity */}
            <div>
              {/* Quick Actions Card */}
              <div className="agency-section-card">
                <div className="agency-section-header">
                  <h2 className="agency-section-title">Quick Actions</h2>
                </div>
                <div className="agency-quick-actions-grid">
                  <Link to="/requests" className="agency-quick-btn">
                    <FiInbox className="agency-quick-btn-icon" />
                    <span>Incoming requests ({counts.inbox})</span>
                  </Link>

                  <Link to="/quotations" className="agency-quick-btn">
                    <FiFileText className="agency-quick-btn-icon" />
                    <span>My quotations ({counts.quotations})</span>
                  </Link>

                  <Link to="/messages" className="agency-quick-btn">
                    <FiMessageSquare className="agency-quick-btn-icon" />
                    <span>Active Conversations ({counts.conversations})</span>
                  </Link>

                  <Link to="/jobs" className="agency-quick-btn">
                    <FiBriefcase className="agency-quick-btn-icon" />
                    <span>Accepted Jobs ({counts.jobs})</span>
                  </Link>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="agency-section-card">
                <div className="agency-section-header">
                  <h2 className="agency-section-title">
                    <FiClock style={{ color: 'var(--agency-text-muted)' }} />
                    Recent Activity
                  </h2>
                </div>

                {recentActivity.length === 0 ? (
                  <p style={{ color: 'var(--agency-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    No recent activity recorded.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {recentActivity.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          fontSize: '0.85rem',
                          paddingBottom: '0.6rem',
                          borderBottom: '1px solid var(--agency-border-subtle)',
                        }}
                      >
                        <FiCheckCircle
                          style={{
                            color: 'var(--agency-secondary)',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--agency-text)' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--agency-text-light)' }}>
                            {new Date(act.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AgencyAppLayout>
  );
}
